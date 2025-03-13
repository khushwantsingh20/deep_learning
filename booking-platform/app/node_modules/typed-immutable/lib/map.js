(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./typed", "immutable"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./typed"), require("immutable"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.typed, global.Immutable);
    global.map = mod.exports;
  }
})(this, function (exports, _typed, _immutable) {
  "use strict";

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

  var ImmutableMap = _immutable.Map;
  var Keyed = _immutable.Iterable.Keyed;

  var $store = _typed.Typed.store;
  var $type = _typed.Typed.type;
  var $read = _typed.Typed.read;
  var $step = _typed.Typed.step;
  var $init = _typed.Typed.init;
  var $result = _typed.Typed.result;
  var $label = _typed.Typed.label;
  var $typeName = _typed.Typed.typeName;
  var $empty = _typed.Typed.empty;

  var EntryType = (function (_Type) {
    _inherits(EntryType, _Type);

    function EntryType(key, value, label) {
      _classCallCheck(this, EntryType);

      _get(Object.getPrototypeOf(EntryType.prototype), "constructor", this).call(this);
      this.key = key;
      this.value = value;
      this.label = label;
    }

    _createClass(EntryType, [{
      key: _typed.Typed.typeName,
      value: function value() {
        return this.label || this.key[$typeName]() + ", " + this.value[$typeName]();
      }
    }, {
      key: _typed.Typed.read,
      value: (function (_value) {
        function value(_x) {
          return _value.apply(this, arguments);
        }

        value.toString = function () {
          return _value.toString();
        };

        return value;
      })(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var key = _ref2[0];
        var value = _ref2[1];

        var keyResult = this.key[$read](key);
        if (keyResult instanceof TypeError) {
          return TypeError("Invalid key: " + keyResult.message);
        }

        var valueResult = this.value[$read](value);
        if (valueResult instanceof TypeError) {
          return TypeError("Invalid value: " + valueResult.message);
        }

        return [keyResult, valueResult];
      })
    }]);

    return EntryType;
  })(_typed.Type);

  var InferredEntryType = (function (_EntryType) {
    _inherits(InferredEntryType, _EntryType);

    function InferredEntryType() {
      _classCallCheck(this, InferredEntryType);

      _get(Object.getPrototypeOf(InferredEntryType.prototype), "constructor", this).call(this, key, value);
    }

    _createClass(InferredEntryType, [{
      key: "toStatic",
      value: function toStatic() {
        return new MapEntryType(this.key, this.value);
      }
    }, {
      key: _typed.Typed.typeName,
      value: function value() {
        var key = this.key ? this.key[$typeName]() : "TypeInferred";
        var value = this.value ? this.value[$typeName]() : "TypeInferred";
        return key + ", " + value;
      }
    }, {
      key: _typed.Typed.read,
      value: function value(entry) {
        // typeOf usually creates type for the value with that
        // value being a default. For type inference we should
        // actually use a base type instead of type with default
        // there for we use prototype of the constructor.
        var key = (0, _typed.typeOf)(entry[0]).constructor.prototype;
        this.key = this.key ? (0, _typed.Union)(this.key, key) : key;

        var value = (0, _typed.typeOf)(entry[1]).constructor.prototype;
        this.value = this.value ? (0, _typed.Union)(this.value, value) : value;

        return entry;
      }
    }]);

    return InferredEntryType;
  })(EntryType);

  var BaseImmutableMap = function BaseImmutableMap() {};
  BaseImmutableMap.prototype = _immutable.Map.prototype;

  var TypedMap = (function (_BaseImmutableMap) {
    _inherits(TypedMap, _BaseImmutableMap);

    function TypedMap(value) {
      _classCallCheck(this, TypedMap);

      _get(Object.getPrototypeOf(TypedMap.prototype), "constructor", this).call(this);
      return TypedMap.prototype[$read](value);
    }

    _createClass(TypedMap, [{
      key: "advance",
      value: function advance(store) {
        var result = store.__ownerID ? this : (0, _typed.construct)(this);
        result[$store] = store;
        result.size = store.size;
        result.__ownerID = store.__ownerID;
        return result;
      }
    }, {
      key: _typed.Typed.init,
      value: function value() {
        return this.advance(ImmutableMap()).asMutable();
      }
    }, {
      key: _typed.Typed.step,
      value: function value(state, entry) {
        var result = this[$type][$read](entry);

        if (result instanceof TypeError) {
          throw result;
        }

        var _result = _slicedToArray(result, 2);

        var key = _result[0];
        var value = _result[1];

        return state.advance(state[$store].set(key, value));
      }
    }, {
      key: _typed.Typed.result,
      value: function value(state) {
        return state.asImmutable();
      }
    }, {
      key: _typed.Typed.read,
      value: function value(structure) {
        var constructor = this.constructor;

        if (structure === null || structure === void 0) {
          if (!this[$empty]) {
            this[$empty] = this.advance(ImmutableMap());
          }

          return this[$empty];
        }

        var isInstance = structure instanceof constructor && structure.constructor === constructor;

        if (isInstance) {
          return structure;
        }

        var entries = Keyed(structure).entries();
        var type = this[$type];
        var state = this[$init]();

        while (true) {
          var _entries$next = entries.next();

          var done = _entries$next.done;
          var entry = _entries$next.value;

          if (done) {
            break;
          }

          var result = type[$read](entry);

          if (result instanceof TypeError) {
            return result;
          }

          state = state[$step](state, result);
        }

        return this[$result](state);
      }
    }, {
      key: _typed.Typed.typeName,
      value: function value() {
        return this[$label] || "Typed.Map(" + this[$type][$typeName]() + ")";
      }
    }, {
      key: "toString",
      value: function toString() {
        return this.__toString(this[$typeName]() + '({', '})');
      }
    }, {
      key: "has",
      value: function has(key) {
        return this[$store].has(key);
      }
    }, {
      key: "get",
      value: function get(key, fallback) {
        return this[$store].get(key, fallback);
      }
    }, {
      key: "clear",
      value: function clear() {
        if (this.size === 0) {
          return this;
        }

        if (this.__ownerID) {
          return this.advance(this[$store].clear());
        }

        return this[$empty] || this[$read]();
      }
    }, {
      key: "remove",
      value: function remove(key) {
        return this.advance(this[$store].remove(key));
      }
    }, {
      key: "set",
      value: function set(key, value) {
        return this[$step](this, [key, value]);
      }
    }, {
      key: "wasAltered",
      value: function wasAltered() {
        return this[$store].wasAltered();
      }
    }, {
      key: "__ensureOwner",
      value: function __ensureOwner(ownerID) {
        var result = this.__ownerID === ownerID ? this : !ownerID ? this : (0, _typed.construct)(this);

        var store = this[$store].__ensureOwner(ownerID);
        result[$store] = store;
        result.size = store.size;
        result.__ownerID = ownerID;

        return result;
      }
    }, {
      key: "__iterator",
      value: function __iterator(type, reverse) {
        return this[$store].__iterator(type, reverse);
      }
    }, {
      key: "__iterate",
      value: function __iterate(f, reverse) {
        return this[$store].__iterate(f, reverse);
      }
    }]);

    return TypedMap;
  })(BaseImmutableMap);

  TypedMap.prototype[_typed.Typed.DELETE] = TypedMap.prototype.remove;

  var TypeInferredMap = (function (_TypedMap) {
    _inherits(TypeInferredMap, _TypedMap);

    function TypeInferredMap() {
      _classCallCheck(this, TypeInferredMap);

      _get(Object.getPrototypeOf(TypeInferredMap.prototype), "constructor", this).call(this);
    }

    _createClass(TypeInferredMap, [{
      key: _typed.Typed.init,
      value: function value() {
        var result = this.advance(ImmutableMap()).asMutable();
        result[$type] = new InferredEntryType();
        return result;
      }
    }, {
      key: _typed.Typed.result,
      value: function value(state) {
        var result = state.asImmutable();
        result[$type] = state[$type].toStatic();

        return result;
      }
    }]);

    return TypeInferredMap;
  })(TypedMap);

  var Map = function Map(keyDescriptor, valueDescriptor, label) {
    var _Object$create;

    if (keyDescriptor === void 0) {
      throw TypeError("Typed.Map must be passed a key type descriptor");
    }

    if (valueDescriptor === void 0) {
      throw TypeError("Typed.Map must be passed a value type descriptor");
    }

    // If both key and value types are Any this is just a plain immutable map.
    if (keyDescriptor === _typed.Any && valueDescriptor === _typed.Any) {
      return ImmutableMap;
    }

    var keyType = (0, _typed.typeOf)(keyDescriptor);
    var valueType = (0, _typed.typeOf)(valueDescriptor);

    if (keyType === _typed.Any && keyDescriptor !== _typed.Any) {
      throw TypeError("Typed.Map was passed an invalid key type descriptor: " + keyDescriptor);
    }

    if (valueType === _typed.Any && valueDescriptor !== _typed.Any) {
      throw TypeError("Typed.Map was passed an invalid value type descriptor: " + valueDescriptor);
    }

    var type = new EntryType(keyType, valueType, label);

    var MapType = function MapType(value) {
      var isMapType = this instanceof MapType;
      var constructor = isMapType ? this.constructor : MapType;

      if (value instanceof constructor) {
        return value;
      }

      var result = constructor.prototype[$read](value);

      if (result instanceof TypeError) {
        throw result;
      }

      if (isMapType && !this[$store]) {
        this[$store] = result[$store];
        this.size = result.size;
      } else {
        return result;
      }

      return this;
    };

    MapType.of = function () {
      for (var _len = arguments.length, keyValues = Array(_len), _key = 0; _key < _len; _key++) {
        keyValues[_key] = arguments[_key];
      }

      return MapType().withMutations(function (map) {
        for (var i = 0; i < keyValues.length; i += 2) {
          if (i + 1 >= keyValues.length) {
            throw new Error('Missing value for key: ' + keyValues[i]);
          }
          map.set(keyValues[i], keyValues[i + 1]);
        }
      });
    };

    MapType.prototype = Object.create(MapPrototype, (_Object$create = {
      constructor: { value: MapType }
    }, _defineProperty(_Object$create, $type, { value: type }), _defineProperty(_Object$create, $label, { value: label }), _Object$create));

    return MapType;
  };
  exports.Map = Map;
  Map.Type = TypedMap;
  Map.prototype = TypedMap.prototype;
  var MapPrototype = Map.prototype;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzVDLGNBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQzdCLGtCQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1dBQzNEO0FBQ0QsYUFBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3pDO09BQ0YsQ0FBQyxDQUFDO0tBQ0osQ0FBQTs7QUFFRCxXQUFPLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWTtBQUM1QyxpQkFBVyxFQUFFLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBQzt1Q0FDNUIsS0FBSyxFQUFHLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBQyxtQ0FDckIsTUFBTSxFQUFHLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxtQkFDeEIsQ0FBQTs7QUFFRixXQUFPLE9BQU8sQ0FBQTtHQUNmLENBQUE7O0FBQ0QsS0FBRyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUE7QUFDbkIsS0FBRyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFBO0FBQ2xDLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUEiLCJmaWxlIjoibWFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtUeXBlZCwgVHlwZSwgVW5pb24sIEFueSwgdHlwZU9mLCBjb25zdHJ1Y3R9IGZyb20gXCIuL3R5cGVkXCJcbmltcG9ydCAqIGFzIEltbXV0YWJsZSBmcm9tICdpbW11dGFibGUnXG5cblxuY29uc3QgSW1tdXRhYmxlTWFwID0gSW1tdXRhYmxlLk1hcFxuY29uc3Qge0tleWVkfSA9IEltbXV0YWJsZS5JdGVyYWJsZVxuXG5jb25zdCAkc3RvcmUgPSBUeXBlZC5zdG9yZVxuY29uc3QgJHR5cGUgPSBUeXBlZC50eXBlXG5jb25zdCAkcmVhZCA9IFR5cGVkLnJlYWRcbmNvbnN0ICRzdGVwID0gVHlwZWQuc3RlcFxuY29uc3QgJGluaXQgPSBUeXBlZC5pbml0XG5jb25zdCAkcmVzdWx0ID0gVHlwZWQucmVzdWx0XG5jb25zdCAkbGFiZWwgPSBUeXBlZC5sYWJlbFxuY29uc3QgJHR5cGVOYW1lID0gVHlwZWQudHlwZU5hbWVcbmNvbnN0ICRlbXB0eSA9IFR5cGVkLmVtcHR5XG5cbmNsYXNzIEVudHJ5VHlwZSBleHRlbmRzIFR5cGUge1xuICBjb25zdHJ1Y3RvcihrZXksIHZhbHVlLCBsYWJlbCkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLmtleSA9IGtleVxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMubGFiZWwgPSBsYWJlbFxuICB9XG4gIFtUeXBlZC50eXBlTmFtZV0oKSB7XG4gICAgcmV0dXJuIHRoaXMubGFiZWwgfHxcbiAgICAgICAgICAgYCR7dGhpcy5rZXlbJHR5cGVOYW1lXSgpfSwgJHt0aGlzLnZhbHVlWyR0eXBlTmFtZV0oKX1gXG4gIH1cbiAgW1R5cGVkLnJlYWRdKFtrZXksIHZhbHVlXSkge1xuICAgIGNvbnN0IGtleVJlc3VsdCA9IHRoaXMua2V5WyRyZWFkXShrZXkpXG4gICAgaWYgKGtleVJlc3VsdCBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgICAgcmV0dXJuIFR5cGVFcnJvcihgSW52YWxpZCBrZXk6ICR7a2V5UmVzdWx0Lm1lc3NhZ2V9YClcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZVJlc3VsdCA9IHRoaXMudmFsdWVbJHJlYWRdKHZhbHVlKVxuICAgIGlmICh2YWx1ZVJlc3VsdCBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgICAgcmV0dXJuIFR5cGVFcnJvcihgSW52YWxpZCB2YWx1ZTogJHt2YWx1ZVJlc3VsdC5tZXNzYWdlfWApXG4gICAgfVxuXG4gICAgcmV0dXJuIFtrZXlSZXN1bHQsIHZhbHVlUmVzdWx0XVxuICB9XG59XG5cbmNsYXNzIEluZmVycmVkRW50cnlUeXBlIGV4dGVuZHMgRW50cnlUeXBlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoa2V5LCB2YWx1ZSlcbiAgfVxuICB0b1N0YXRpYygpIHtcbiAgICByZXR1cm4gbmV3IE1hcEVudHJ5VHlwZSh0aGlzLmtleSwgdGhpcy52YWx1ZSlcbiAgfVxuICBbVHlwZWQudHlwZU5hbWVdKCkge1xuICAgIGNvbnN0IGtleSA9IHRoaXMua2V5ID8gdGhpcy5rZXlbJHR5cGVOYW1lXSgpIDogXCJUeXBlSW5mZXJyZWRcIlxuICAgIGNvbnN0IHZhbHVlID0gdGhpcy52YWx1ZSA/IHRoaXMudmFsdWVbJHR5cGVOYW1lXSgpIDogXCJUeXBlSW5mZXJyZWRcIlxuICAgIHJldHVybiBgJHtrZXl9LCAke3ZhbHVlfWBcbiAgfVxuICBbVHlwZWQucmVhZF0oZW50cnkpIHtcbiAgICAvLyB0eXBlT2YgdXN1YWxseSBjcmVhdGVzIHR5cGUgZm9yIHRoZSB2YWx1ZSB3aXRoIHRoYXRcbiAgICAvLyB2YWx1ZSBiZWluZyBhIGRlZmF1bHQuIEZvciB0eXBlIGluZmVyZW5jZSB3ZSBzaG91bGRcbiAgICAvLyBhY3R1YWxseSB1c2UgYSBiYXNlIHR5cGUgaW5zdGVhZCBvZiB0eXBlIHdpdGggZGVmYXVsdFxuICAgIC8vIHRoZXJlIGZvciB3ZSB1c2UgcHJvdG90eXBlIG9mIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICBjb25zdCBrZXkgPSB0eXBlT2YoZW50cnlbMF0pLmNvbnN0cnVjdG9yLnByb3RvdHlwZVxuICAgIHRoaXMua2V5ID0gdGhpcy5rZXkgPyBVbmlvbih0aGlzLmtleSwga2V5KSA6IGtleVxuXG4gICAgY29uc3QgdmFsdWUgPSB0eXBlT2YoZW50cnlbMV0pLmNvbnN0cnVjdG9yLnByb3RvdHlwZVxuICAgIHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlID8gVW5pb24odGhpcy52YWx1ZSwgdmFsdWUpIDogdmFsdWVcblxuICAgIHJldHVybiBlbnRyeVxuICB9XG59XG5cbmNvbnN0IEJhc2VJbW11dGFibGVNYXAgPSBmdW5jdGlvbigpIHt9XG5CYXNlSW1tdXRhYmxlTWFwLnByb3RvdHlwZSA9IEltbXV0YWJsZS5NYXAucHJvdG90eXBlXG5cbmNsYXNzIFR5cGVkTWFwIGV4dGVuZHMgQmFzZUltbXV0YWJsZU1hcCB7XG4gIGNvbnN0cnVjdG9yKHZhbHVlKSB7XG4gICAgc3VwZXIoKVxuICAgIHJldHVybiBUeXBlZE1hcC5wcm90b3R5cGVbJHJlYWRdKHZhbHVlKVxuICB9XG4gIGFkdmFuY2Uoc3RvcmUpIHtcbiAgICBjb25zdCByZXN1bHQgPSBzdG9yZS5fX293bmVySUQgPyB0aGlzIDogY29uc3RydWN0KHRoaXMpXG4gICAgcmVzdWx0WyRzdG9yZV0gPSBzdG9yZVxuICAgIHJlc3VsdC5zaXplID0gc3RvcmUuc2l6ZVxuICAgIHJlc3VsdC5fX293bmVySUQgPSBzdG9yZS5fX293bmVySURcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgW1R5cGVkLmluaXRdKCkge1xuICAgIHJldHVybiB0aGlzLmFkdmFuY2UoSW1tdXRhYmxlTWFwKCkpLmFzTXV0YWJsZSgpXG4gIH1cbiAgW1R5cGVkLnN0ZXBdKHN0YXRlLCBlbnRyeSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXNbJHR5cGVdWyRyZWFkXShlbnRyeSlcblxuICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICAgIHRocm93IHJlc3VsdFxuICAgIH1cblxuICAgIGNvbnN0IFtrZXksIHZhbHVlXSA9IHJlc3VsdFxuICAgIHJldHVybiBzdGF0ZS5hZHZhbmNlKHN0YXRlWyRzdG9yZV0uc2V0KGtleSwgdmFsdWUpKVxuICB9XG4gIFtUeXBlZC5yZXN1bHRdKHN0YXRlKSB7XG4gICAgcmV0dXJuIHN0YXRlLmFzSW1tdXRhYmxlKClcbiAgfVxuXG4gIFtUeXBlZC5yZWFkXShzdHJ1Y3R1cmUpIHtcbiAgICBjb25zdCBjb25zdHJ1Y3RvciA9IHRoaXMuY29uc3RydWN0b3JcblxuICAgIGlmIChzdHJ1Y3R1cmUgPT09IG51bGwgfHwgc3RydWN0dXJlID09PSB2b2lkKDApKSB7XG4gICAgICBpZiAoIXRoaXNbJGVtcHR5XSkge1xuICAgICAgICB0aGlzWyRlbXB0eV0gPSB0aGlzLmFkdmFuY2UoSW1tdXRhYmxlTWFwKCkpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzWyRlbXB0eV1cbiAgICB9XG5cbiAgICBjb25zdCBpc0luc3RhbmNlID0gc3RydWN0dXJlIGluc3RhbmNlb2YgY29uc3RydWN0b3IgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgc3RydWN0dXJlLmNvbnN0cnVjdG9yID09PSBjb25zdHJ1Y3RvclxuXG4gICAgaWYgKGlzSW5zdGFuY2UpIHtcbiAgICAgIHJldHVybiBzdHJ1Y3R1cmVcbiAgICB9XG5cblxuICAgIGNvbnN0IGVudHJpZXMgPSBLZXllZChzdHJ1Y3R1cmUpLmVudHJpZXMoKVxuICAgIGNvbnN0IHR5cGUgPSB0aGlzWyR0eXBlXVxuICAgIGxldCBzdGF0ZSA9IHRoaXNbJGluaXRdKClcblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCB7ZG9uZSwgdmFsdWU6IGVudHJ5fSA9IGVudHJpZXMubmV4dCgpXG5cbiAgICAgIGlmIChkb25lKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHR5cGVbJHJlYWRdKGVudHJ5KVxuXG4gICAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgIH1cblxuICAgICAgc3RhdGUgPSBzdGF0ZVskc3RlcF0oc3RhdGUsIHJlc3VsdClcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1skcmVzdWx0XShzdGF0ZSlcbiAgfVxuXG4gIFtUeXBlZC50eXBlTmFtZV0oKSB7XG4gICAgcmV0dXJuIHRoaXNbJGxhYmVsXSB8fCBgVHlwZWQuTWFwKCR7dGhpc1skdHlwZV1bJHR5cGVOYW1lXSgpfSlgXG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5fX3RvU3RyaW5nKHRoaXNbJHR5cGVOYW1lXSgpICsgJyh7JywgJ30pJylcbiAgfVxuXG4gIGhhcyhrZXkpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdLmhhcyhrZXkpXG4gIH1cblxuICBnZXQoa2V5LCBmYWxsYmFjaykge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV0uZ2V0KGtleSwgZmFsbGJhY2spXG4gIH1cblxuICBjbGVhcigpIHtcbiAgICBpZiAodGhpcy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgcmV0dXJuIHRoaXMuYWR2YW5jZSh0aGlzWyRzdG9yZV0uY2xlYXIoKSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1skZW1wdHldIHx8IHRoaXNbJHJlYWRdKClcbiAgfVxuXG4gIHJlbW92ZShrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5hZHZhbmNlKHRoaXNbJHN0b3JlXS5yZW1vdmUoa2V5KSlcbiAgfVxuXG4gIHNldChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0ZXBdKHRoaXMsIFtrZXksIHZhbHVlXSlcbiAgfVxuXG4gIHdhc0FsdGVyZWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXS53YXNBbHRlcmVkKClcbiAgfVxuXG4gIF9fZW5zdXJlT3duZXIob3duZXJJRCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX19vd25lcklEID09PSBvd25lcklEID8gdGhpcyA6XG4gICAgICAgICAgICAgICAgICAgIW93bmVySUQgPyB0aGlzIDpcbiAgICAgICAgICAgICAgICAgICBjb25zdHJ1Y3QodGhpcylcblxuICAgIGNvbnN0IHN0b3JlID0gdGhpc1skc3RvcmVdLl9fZW5zdXJlT3duZXIob3duZXJJRClcbiAgICByZXN1bHRbJHN0b3JlXSA9IHN0b3JlXG4gICAgcmVzdWx0LnNpemUgPSBzdG9yZS5zaXplXG4gICAgcmVzdWx0Ll9fb3duZXJJRCA9IG93bmVySURcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBfX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSlcbiAgfVxuXG4gIF9faXRlcmF0ZShmLCByZXZlcnNlKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXS5fX2l0ZXJhdGUoZiwgcmV2ZXJzZSlcbiAgfVxufVxuVHlwZWRNYXAucHJvdG90eXBlW1R5cGVkLkRFTEVURV0gPSBUeXBlZE1hcC5wcm90b3R5cGUucmVtb3ZlXG5cbmNsYXNzIFR5cGVJbmZlcnJlZE1hcCBleHRlbmRzIFR5cGVkTWFwIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuICB9XG4gIFtUeXBlZC5pbml0XSgpIHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLmFkdmFuY2UoSW1tdXRhYmxlTWFwKCkpLmFzTXV0YWJsZSgpXG4gICAgcmVzdWx0WyR0eXBlXSA9IG5ldyBJbmZlcnJlZEVudHJ5VHlwZSgpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIFtUeXBlZC5yZXN1bHRdKHN0YXRlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gc3RhdGUuYXNJbW11dGFibGUoKVxuICAgIHJlc3VsdFskdHlwZV0gPSBzdGF0ZVskdHlwZV0udG9TdGF0aWMoKVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBNYXAgPSBmdW5jdGlvbihrZXlEZXNjcmlwdG9yLCB2YWx1ZURlc2NyaXB0b3IsIGxhYmVsKSB7XG4gIGlmIChrZXlEZXNjcmlwdG9yID09PSB2b2lkKDApKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFwiVHlwZWQuTWFwIG11c3QgYmUgcGFzc2VkIGEga2V5IHR5cGUgZGVzY3JpcHRvclwiKVxuICB9XG5cbiAgaWYgKHZhbHVlRGVzY3JpcHRvciA9PT0gdm9pZCgwKSkge1xuICAgIHRocm93IFR5cGVFcnJvcihcIlR5cGVkLk1hcCBtdXN0IGJlIHBhc3NlZCBhIHZhbHVlIHR5cGUgZGVzY3JpcHRvclwiKVxuICB9XG5cbiAgLy8gSWYgYm90aCBrZXkgYW5kIHZhbHVlIHR5cGVzIGFyZSBBbnkgdGhpcyBpcyBqdXN0IGEgcGxhaW4gaW1tdXRhYmxlIG1hcC5cbiAgaWYgKGtleURlc2NyaXB0b3IgPT09IEFueSAmJiB2YWx1ZURlc2NyaXB0b3IgPT09IEFueSkge1xuICAgIHJldHVybiBJbW11dGFibGVNYXBcbiAgfVxuXG4gIGNvbnN0IGtleVR5cGUgPSB0eXBlT2Yoa2V5RGVzY3JpcHRvcilcbiAgY29uc3QgdmFsdWVUeXBlID0gdHlwZU9mKHZhbHVlRGVzY3JpcHRvcilcblxuICBpZiAoa2V5VHlwZSA9PT0gQW55ICYmIGtleURlc2NyaXB0b3IgIT09IEFueSkge1xuICAgIHRocm93IFR5cGVFcnJvcihgVHlwZWQuTWFwIHdhcyBwYXNzZWQgYW4gaW52YWxpZCBrZXkgdHlwZSBkZXNjcmlwdG9yOiAke2tleURlc2NyaXB0b3J9YClcbiAgfVxuXG4gIGlmICh2YWx1ZVR5cGUgPT09IEFueSAmJiB2YWx1ZURlc2NyaXB0b3IgIT09IEFueSkge1xuICAgIHRocm93IFR5cGVFcnJvcihgVHlwZWQuTWFwIHdhcyBwYXNzZWQgYW4gaW52YWxpZCB2YWx1ZSB0eXBlIGRlc2NyaXB0b3I6ICR7dmFsdWVEZXNjcmlwdG9yfWApXG4gIH1cblxuICBjb25zdCB0eXBlID0gbmV3IEVudHJ5VHlwZShrZXlUeXBlLCB2YWx1ZVR5cGUsIGxhYmVsKVxuXG4gIGNvbnN0IE1hcFR5cGUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGNvbnN0IGlzTWFwVHlwZSA9IHRoaXMgaW5zdGFuY2VvZiBNYXBUeXBlXG4gICAgY29uc3QgY29uc3RydWN0b3IgPSBpc01hcFR5cGUgPyB0aGlzLmNvbnN0cnVjdG9yIDogTWFwVHlwZVxuXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgY29uc3RydWN0b3IpIHtcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IGNvbnN0cnVjdG9yLnByb3RvdHlwZVskcmVhZF0odmFsdWUpXG5cbiAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgICB0aHJvdyByZXN1bHRcbiAgICB9XG5cbiAgICBpZiAoaXNNYXBUeXBlICYmICF0aGlzWyRzdG9yZV0pIHtcbiAgICAgIHRoaXNbJHN0b3JlXSA9IHJlc3VsdFskc3RvcmVdXG4gICAgICB0aGlzLnNpemUgPSByZXN1bHQuc2l6ZVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBcbiAgTWFwVHlwZS5vZiA9ICguLi5rZXlWYWx1ZXMpID0+IHtcbiAgICByZXR1cm4gTWFwVHlwZSgpLndpdGhNdXRhdGlvbnMobWFwID0+IHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5VmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIGlmIChpICsgMSA+PSBrZXlWYWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIHZhbHVlIGZvciBrZXk6ICcgKyBrZXlWYWx1ZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIG1hcC5zZXQoa2V5VmFsdWVzW2ldLCBrZXlWYWx1ZXNbaSArIDFdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIE1hcFR5cGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShNYXBQcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3Rvcjoge3ZhbHVlOiBNYXBUeXBlfSxcbiAgICBbJHR5cGVdOiB7dmFsdWU6IHR5cGV9LFxuICAgIFskbGFiZWxdOiB7dmFsdWU6IGxhYmVsfVxuICB9KVxuXG4gIHJldHVybiBNYXBUeXBlXG59XG5NYXAuVHlwZSA9IFR5cGVkTWFwXG5NYXAucHJvdG90eXBlID0gVHlwZWRNYXAucHJvdG90eXBlXG5jb25zdCBNYXBQcm90b3R5cGUgPSBNYXAucHJvdG90eXBlXG4iXX0=