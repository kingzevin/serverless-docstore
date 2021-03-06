// Generated by CoffeeScript 1.12.7
(function() {
  var DocArchive, DocManager, Errors, MongoManager, RangeManager, _, logger;

  MongoManager = require("./MongoManager");

  Errors = require("./Errors");

  logger = require("logger-sharelatex");

  _ = require("underscore");

  DocArchive = require("./DocArchiveManager");

  RangeManager = require("./RangeManager");

  module.exports = DocManager = {
    _getDoc: function(project_id, doc_id, filter, callback) {
      if (filter == null) {
        filter = {};
      }
      if (callback == null) {
        callback = function(error, doc) {};
      }
      if (filter.inS3 !== true) {
        return callback("must include inS3 when getting doc");
      }
      return MongoManager.findDoc(project_id, doc_id, filter, function(err, doc) {
        if (err != null) {
          return callback(err);
        } else if (doc == null) {
          return callback(new Errors.NotFoundError("No such doc: " + doc_id + " in project " + project_id));
        } else if (doc != null ? doc.inS3 : void 0) {
          return DocArchive.unarchiveDoc(project_id, doc_id, function(err) {
            if (err != null) {
              logger.err({
                err: err,
                project_id: project_id,
                doc_id: doc_id
              }, "error unarchiving doc");
              return callback(err);
            }
            return DocManager._getDoc(project_id, doc_id, filter, callback);
          });
        } else {
          if (filter.version) {
            return MongoManager.getDocVersion(doc_id, function(error, version) {
              if (error != null) {
                return callback(error);
              }
              doc.version = version;
              return callback(err, doc);
            });
          } else {
            return callback(err, doc);
          }
        }
      });
    },
    checkDocExists: function(project_id, doc_id, callback) {
      if (callback == null) {
        callback = function(err, exists) {};
      }
      return DocManager._getDoc(project_id, doc_id, {
        _id: 1,
        inS3: true
      }, function(err, doc) {
        if (err != null) {
          return callback(err);
        }
        return callback(err, doc != null);
      });
    },
    getFullDoc: function(project_id, doc_id, callback) {
      if (callback == null) {
        callback = function(err, doc) {};
      }
      return DocManager._getDoc(project_id, doc_id, {
        lines: true,
        rev: true,
        deleted: true,
        version: true,
        ranges: true,
        inS3: true
      }, function(err, doc) {
        if (err != null) {
          return callback(err);
        }
        return callback(err, doc);
      });
    },
    getDocLines: function(project_id, doc_id, callback) {
      if (callback == null) {
        callback = function(err, doc) {};
      }
      return DocManager._getDoc(project_id, doc_id, {
        lines: true,
        inS3: true
      }, function(err, doc) {
        if (err != null) {
          return callback(err);
        }
        return callback(err, doc);
      });
    },
    getAllNonDeletedDocs: function(project_id, filter, callback) {
      if (callback == null) {
        callback = function(error, docs) {};
      }
      return DocArchive.unArchiveAllDocs(project_id, function(error) {
        if (error != null) {
          return callback(error);
        }
        return MongoManager.getProjectsDocs(project_id, {
          include_deleted: false
        }, filter, function(error, docs) {
          if (typeof err !== "undefined" && err !== null) {
            return callback(error);
          } else if (docs == null) {
            return callback(new Errors.NotFoundError("No docs for project " + project_id));
          } else {
            return callback(null, docs);
          }
        });
      });
    },
    updateDoc: function(project_id, doc_id, lines, version, ranges, callback) {
      if (callback == null) {
        callback = function(error, modified, rev) {};
      }
      if ((lines == null) || (version == null) || (ranges == null)) {
        return callback(new Error("no lines, version or ranges provided"));
      }
      return DocManager._getDoc(project_id, doc_id, {
        version: true,
        rev: true,
        lines: true,
        version: true,
        ranges: true,
        inS3: true
      }, function(err, doc) {
        var modified, rev, updateLines, updateLinesAndRangesIfNeeded, updateRanges, updateVersion, updateVersionIfNeeded;
        if ((err != null) && !(err instanceof Errors.NotFoundError)) {
          logger.err({
            project_id: project_id,
            doc_id: doc_id,
            err: err
          }, "error getting document for update");
          return callback(err);
        }
        ranges = RangeManager.jsonRangesToMongo(ranges);
        if (doc == null) {
          updateLines = true;
          updateVersion = true;
          updateRanges = true;
        } else {
          updateLines = !_.isEqual(doc.lines, lines);
          updateVersion = doc.version !== version;
          updateRanges = RangeManager.shouldUpdateRanges(doc.ranges, ranges);
        }
        modified = false;
        rev = (doc != null ? doc.rev : void 0) || 0;
        updateLinesAndRangesIfNeeded = function(cb) {
          var update;
          if (updateLines || updateRanges) {
            update = {};
            if (updateLines) {
              update.lines = lines;
            }
            if (updateRanges) {
              update.ranges = ranges;
            }
            logger.log({
              project_id: project_id,
              doc_id: doc_id
            }, "updating doc lines and ranges");
            modified = true;
            rev += 1;
            return MongoManager.upsertIntoDocCollection(project_id, doc_id, update, cb);
          } else {
            logger.log({
              project_id: project_id,
              doc_id: doc_id
            }, "doc lines have not changed - not updating");
            return cb();
          }
        };
        updateVersionIfNeeded = function(cb) {
          if (updateVersion) {
            logger.log({
              project_id: project_id,
              doc_id: doc_id,
              oldVersion: doc != null ? doc.version : void 0,
              newVersion: version
            }, "updating doc version");
            modified = true;
            return MongoManager.setDocVersion(doc_id, version, cb);
          } else {
            logger.log({
              project_id: project_id,
              doc_id: doc_id,
              version: version
            }, "doc version has not changed - not updating");
            return cb();
          }
        };
        return updateLinesAndRangesIfNeeded(function(error) {
          if (error != null) {
            return callback(error);
          }
          return updateVersionIfNeeded(function(error) {
            if (error != null) {
              return callback(error);
            }
            return callback(null, modified, rev);
          });
        });
      });
    },
    deleteDoc: function(project_id, doc_id, callback) {
      if (callback == null) {
        callback = function(error) {};
      }
      return DocManager.checkDocExists(project_id, doc_id, function(error, exists) {
        if (error != null) {
          return callback(error);
        }
        if (!exists) {
          return callback(new Errors.NotFoundError("No such project/doc to delete: " + project_id + "/" + doc_id));
        }
        return MongoManager.markDocAsDeleted(project_id, doc_id, callback);
      });
    }
  };

}).call(this);

//# sourceMappingURL=DocManager.js.map
