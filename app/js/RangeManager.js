// Generated by CoffeeScript 1.12.7
(function() {
  var ObjectId, RangeManager, _;

  _ = require("underscore");

  ObjectId = require("./mongojs").ObjectId;

  module.exports = RangeManager = {
    shouldUpdateRanges: function(doc_ranges, incoming_ranges) {
      if (incoming_ranges == null) {
        throw new Error("expected incoming_ranges");
      }
      if (doc_ranges == null) {
        doc_ranges = {};
      }
      return !_.isEqual(doc_ranges, incoming_ranges);
    },
    jsonRangesToMongo: function(ranges) {
      var change, comment, i, j, len, len1, ref, ref1, ref2, updateMetadata;
      if (ranges == null) {
        return null;
      }
      updateMetadata = function(metadata) {
        if ((metadata != null ? metadata.ts : void 0) != null) {
          metadata.ts = new Date(metadata.ts);
        }
        if ((metadata != null ? metadata.user_id : void 0) != null) {
          return metadata.user_id = RangeManager._safeObjectId(metadata.user_id);
        }
      };
      ref = ranges.changes || [];
      for (i = 0, len = ref.length; i < len; i++) {
        change = ref[i];
        change.id = RangeManager._safeObjectId(change.id);
        updateMetadata(change.metadata);
      }
      ref1 = ranges.comments || [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        comment = ref1[j];
        comment.id = RangeManager._safeObjectId(comment.id);
        if (((ref2 = comment.op) != null ? ref2.t : void 0) != null) {
          comment.op.t = RangeManager._safeObjectId(comment.op.t);
        }
        updateMetadata(comment.metadata);
      }
      return ranges;
    },
    _safeObjectId: function(data) {
      var error;
      try {
        return ObjectId(data);
      } catch (error1) {
        error = error1;
        return data;
      }
    }
  };

}).call(this);

//# sourceMappingURL=RangeManager.js.map
