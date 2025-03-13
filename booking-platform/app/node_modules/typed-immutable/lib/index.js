(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./record", "./list", "./map", "./typed"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./record"), require("./list"), require("./map"), require("./typed"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.record, global.list, global.map, global.typed);
    global.index = mod.exports;
  }
})(this, function (exports, _record, _list, _map, _typed) {
  "use strict";

  Object.defineProperty(exports, "Record", {
    enumerable: true,
    get: function get() {
      return _record.Record;
    }
  });
  Object.defineProperty(exports, "List", {
    enumerable: true,
    get: function get() {
      return _list.List;
    }
  });
  Object.defineProperty(exports, "Map", {
    enumerable: true,
    get: function get() {
      return _map.Map;
    }
  });
  Object.defineProperty(exports, "Typed", {
    enumerable: true,
    get: function get() {
      return _typed.Typed;
    }
  });
  Object.defineProperty(exports, "typeOf", {
    enumerable: true,
    get: function get() {
      return _typed.typeOf;
    }
  });
  Object.defineProperty(exports, "Type", {
    enumerable: true,
    get: function get() {
      return _typed.Type;
    }
  });
  Object.defineProperty(exports, "Any", {
    enumerable: true,
    get: function get() {
      return _typed.Any;
    }
  });
  Object.defineProperty(exports, "Union", {
    enumerable: true,
    get: function get() {
      return _typed.Union;
    }
  });
  Object.defineProperty(exports, "Maybe", {
    enumerable: true,
    get: function get() {
      return _typed.Maybe;
    }
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7cUJBQVEsTUFBTTs7Ozs7O21CQUNOLElBQUk7Ozs7OztrQkFDSixHQUFHOzs7Ozs7b0JBQ0gsS0FBSzs7Ozs7O29CQUFFLE1BQU07Ozs7OztvQkFBRSxJQUFJOzs7Ozs7b0JBQUUsR0FBRzs7Ozs7O29CQUFFLEtBQUs7Ozs7OztvQkFBRSxLQUFLIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHtSZWNvcmR9IGZyb20gXCIuL3JlY29yZFwiXG5leHBvcnQge0xpc3R9IGZyb20gXCIuL2xpc3RcIlxuZXhwb3J0IHtNYXB9IGZyb20gXCIuL21hcFwiXG5leHBvcnQge1R5cGVkLCB0eXBlT2YsIFR5cGUsIEFueSwgVW5pb24sIE1heWJlfSBmcm9tIFwiLi90eXBlZFwiXG4iXX0=