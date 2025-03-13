(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./typed", "immutable"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./typed"), require("immutable"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.typed, global.immutable);
    global.record = mod.exports;
  }
})(this, function (exports, _typed, _immutable) {
  "use strict";

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

  var Keyed = _immutable.Iterable.Keyed;

  var Getter = function Getter(key) {
    return function () {
      return this.get(key);
    };
  };

  var Setter = function Setter(key) {
    return function (value) {
      if (!this.__ownerID) {
        throw TypeError("Cannot set on an immutable record.");
      }
      this.set(key, value);
    };
  };

  var $store = _typed.Typed.store;
  var $type = _typed.Typed.type;
  var $step = _typed.Typed.step;
  var $init = _typed.Typed.init;
  var $result = _typed.Typed.result;
  var $read = _typed.Typed.read;
  var $label = _typed.Typed.label;
  var $empty = _typed.Typed.empty;
  var $typeName = _typed.Typed.typeName;
  var $typeSignature = _typed.Typed.typeSignature;

  var IterableKeyedBase = function IterableKeyedBase() {};
  IterableKeyedBase.prototype = _immutable.Iterable.Keyed.prototype;

  var TypedRecord = (function (_IterableKeyedBase) {
    _inherits(TypedRecord, _IterableKeyedBase);

    function TypedRecord() {
      _classCallCheck(this, TypedRecord);

      _get(Object.getPrototypeOf(TypedRecord.prototype), "constructor", this).call(this);
    }

    _createClass(TypedRecord, [{
      key: _typed.Typed.init,
      value: function value() {
        return (0, _typed.construct)(this).asMutable();
      }
    }, {
      key: _typed.Typed.result,
      value: function value(result) {
        return result.asImmutable();
      }
    }, {
      key: _typed.Typed.read,
      value: function value(structure) {
        var Type = this.constructor;

        if (structure && structure instanceof Type) {
          return structure;
        }

        if (structure === null || structure && typeof structure !== "object") {
          return TypeError("Invalid data structure \"" + structure + "\" was passed to " + this[$typeName]());
        }

        var seq = (0, _immutable.Seq)(structure);
        var type = this[$type];
        var isEmpty = seq.size === 0;

        if (isEmpty && this[$empty]) {
          return this[$empty];
        }

        var record = undefined;
        for (var key in type) {
          var fieldType = type[key];
          var value = seq.has(key) ? seq.get(key) : this.get(key);
          var result = fieldType[$read](value);

          if (fieldType !== _typed.Any && result instanceof TypeError) {
            return TypeError("Invalid value for \"" + key + "\" field:\n " + result.message);
          }

          record = this[$step](record || this[$init](), [key, result]);
        }

        record = this[$result](record);

        if (isEmpty) {
          this[$empty] = record;
        }

        return record;
      }
    }, {
      key: _typed.Typed.step,
      value: function value(result, _ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var key = _ref2[0];
        var _value = _ref2[1];

        var store = result[$store] ? result[$store].set(key, _value) : new _immutable.Map([[key, _value]]);

        if (result[$store] === store) {
          return result;
        }

        var record = result.__ownerID ? result : (0, _typed.construct)(result);
        record[$store] = store;

        return record;
      }
    }, {
      key: _typed.Typed.typeSignature,
      value: function value() {
        var type = this[$type];
        var body = [];
        for (var key in type) {
          body.push(key + ": " + type[key][$typeName]());
        }

        return "Typed.Record({" + body.join(', ') + "})";
      }
    }, {
      key: _typed.Typed.typeName,
      value: function value() {
        return this[$label] || this[$typeSignature]();
      }
    }, {
      key: "toString",
      value: function toString() {
        return this.__toString(this[$typeName]() + '({', '})');
      }
    }, {
      key: "has",
      value: function has(key) {
        return !!this[$type][key];
      }
    }, {
      key: "get",
      value: function get(key, defaultValue) {
        return !this[$type][key] ? defaultValue : !this[$store] ? defaultValue : this[$store].get(key, defaultValue);
      }
    }, {
      key: "clear",
      value: function clear() {
        if (this.__ownerID) {
          this[$store] && this[$store].clear();
          return this;
        }

        return this[$empty] || (this[$empty] = new this.constructor());
      }
    }, {
      key: "remove",
      value: function remove(key) {
        return this[$type][key] ? this.set(key, void 0) : this;
      }
    }, {
      key: "set",
      value: function set(key, value) {
        var fieldType = this[$type][key];

        if (!fieldType) {
          throw TypeError("Cannot set unknown field \"" + key + "\" on \"" + this[$typeName]() + "\"");
        }

        var result = fieldType[$read](value);

        if (fieldType !== _typed.Any && result instanceof TypeError) {
          throw TypeError("Invalid value for " + key + " field: " + result.message);
        }

        return this[$step](this, [key, result]);
      }
    }, {
      key: "__iterator",
      value: function __iterator(type, reverse) {
        var _this = this;

        return Keyed(this[$type]).map(function (_, key) {
          return _this.get(key);
        }).__iterator(type, reverse);
      }
    }, {
      key: "__iterate",
      value: function __iterate(f, reverse) {
        var _this2 = this;

        return Keyed(this[$type]).map(function (_, key) {
          return _this2.get(key);
        }).__iterate(f, reverse);
      }
    }, {
      key: "__ensureOwner",
      value: function __ensureOwner(ownerID) {
        if (ownerID === this.__ownerID) {
          return this;
        }

        var store = this[$store] && this[$store].__ensureOwner(ownerID);
        var result = !ownerID ? this : (0, _typed.construct)(this);

        result.__ownerID = ownerID;
        result[$store] = store;
        return result;
      }
    }, {
      key: "wasAltered",
      value: function wasAltered() {
        return this[$store].wasAltered();
      }
    }]);

    return TypedRecord;
  })(IterableKeyedBase);

  var Record = function Record(descriptor, label) {
    if (descriptor && typeof descriptor === "object") {
      var type = Object.create(null);
      var _keys = Object.keys(descriptor);
      var size = _keys.length;

      if (size > 0) {
        var _properties;

        var _ret = (function () {
          var properties = (_properties = {
            size: { value: size }
          }, _defineProperty(_properties, $type, { value: type }), _defineProperty(_properties, $label, { value: label }), _properties);

          var index = 0;
          while (index < size) {
            var key = _keys[index];
            var fieldType = (0, _typed.typeOf)(descriptor[key]);

            if (fieldType) {
              type[key] = fieldType;
              properties[key] = { get: Getter(key), set: Setter(key), enumerable: true };
            } else {
              throw TypeError("Invalid field descriptor provided for a \"" + key + "\" field");
            }

            index = index + 1;
          }

          var RecordType = function RecordType(structure) {
            var isNew = this instanceof RecordType;
            var constructor = isNew ? this.constructor : RecordType;

            if (structure instanceof constructor) {
              return structure;
            }

            var type = constructor.prototype;
            var result = type[$read](structure);

            if (result instanceof TypeError) {
              throw result;
            }

            if (isNew) {
              this[$store] = result[$store];
            } else {
              return result;
            }
          };

          properties.constructor = { value: RecordType };
          RecordType.prototype = Object.create(RecordPrototype, properties);
          var prototype = RecordType.prototype;

          return {
            v: RecordType
          };
        })();

        if (typeof _ret === "object") return _ret.v;
      } else {
        throw TypeError("Typed.Record descriptor must define at least one field");
      }
    } else {
      throw TypeError("Typed.Record must be passed a descriptor of fields");
    }
  };
  exports.Record = Record;
  Record.Type = TypedRecord;
  Record.prototype = TypedRecord.prototype;
  var RecordPrototype = TypedRecord.prototype;

  RecordPrototype[_typed.Typed.DELETE] = RecordPrototype.remove;

  // Large part of the Record API is implemented by Immutabel.Map
  // and is just copied over.
  RecordPrototype.deleteIn = _immutable.Map.prototype.deleteIn;
  RecordPrototype.removeIn = _immutable.Map.prototype.removeIn;
  RecordPrototype.merge = _immutable.Map.prototype.merge;
  RecordPrototype.mergeWith = _immutable.Map.prototype.mergeWith;
  RecordPrototype.mergeIn = _immutable.Map.prototype.mergeIn;
  RecordPrototype.mergeDeep = _immutable.Map.prototype.mergeDeep;
  RecordPrototype.mergeDeepWith = _immutable.Map.prototype.mergeDeepWith;
  RecordPrototype.mergeDeepIn = _immutable.Map.prototype.mergeDeepIn;
  RecordPrototype.setIn = _immutable.Map.prototype.setIn;
  RecordPrototype.update = _immutable.Map.prototype.update;
  RecordPrototype.updateIn = _immutable.Map.prototype.updateIn;
  RecordPrototype.withMutations = _immutable.Map.prototype.withMutations;
  RecordPrototype.asMutable = _immutable.Map.prototype.asMutable;
  RecordPrototype.asImmutable = _immutable.Map.prototype.asImmutable;

  // Large chuck of API inherited from Iterable does not makes
  // much sense in the context of records so we undefine it.
  RecordPrototype.map = void 0;
  RecordPrototype.filter = void 0;
  RecordPrototype.filterNot = void 0;
  RecordPrototype.flip = void 0;
  RecordPrototype.mapKeys = void 0;
  RecordPrototype.mapEntries = void 0;
  RecordPrototype.sort = void 0;
  RecordPrototype.sortBy = void 0;
  RecordPrototype.reverse = void 0;
  RecordPrototype.slice = void 0;
  RecordPrototype.butLast = void 0;
  RecordPrototype.flatMap = void 0;
  RecordPrototype.flatten = void 0;
  RecordPrototype.rest = void 0;
  RecordPrototype.skip = void 0;
  RecordPrototype.skipLast = void 0;
  RecordPrototype.skipWhile = void 0;
  RecordPrototype.skipUntil = void 0;
  RecordPrototype.sortBy = void 0;
  RecordPrototype.take = void 0;
  RecordPrototype.takeLast = void 0;
  RecordPrototype.takeWhile = void 0;
  RecordPrototype.takeUntil = void 0;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0FBQyxBQUFDLENBQUE7QUFDakMsaUJBQWUsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEFBQUMsQ0FBQTtBQUM5QixpQkFBZSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsQUFBQyxDQUFBO0FBQzlCLGlCQUFlLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxBQUFDLENBQUE7QUFDbEMsaUJBQWUsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLEFBQUMsQ0FBQTtBQUNuQyxpQkFBZSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsQUFBQyxDQUFBO0FBQ25DLGlCQUFlLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxBQUFDLENBQUE7QUFDaEMsaUJBQWUsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEFBQUMsQ0FBQTtBQUM5QixpQkFBZSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsQUFBQyxDQUFBO0FBQ2xDLGlCQUFlLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxBQUFDLENBQUE7QUFDbkMsaUJBQWUsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLEFBQUMsQ0FBQSIsImZpbGUiOiJyZWNvcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1R5cGVkLCB0eXBlT2YsIGNvbnN0cnVjdCwgQW55fSBmcm9tIFwiLi90eXBlZFwiXG5pbXBvcnQge1NlcSwgSXRlcmFibGUsIE1hcH0gZnJvbSAnaW1tdXRhYmxlJ1xuXG5jb25zdCB7S2V5ZWR9ID0gSXRlcmFibGVcblxuY29uc3QgR2V0dGVyID0ga2V5ID0+IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5nZXQoa2V5KVxufVxuXG5jb25zdCBTZXR0ZXIgPSBrZXkgPT4gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKCF0aGlzLl9fb3duZXJJRCkge1xuICAgIHRocm93IFR5cGVFcnJvcihcIkNhbm5vdCBzZXQgb24gYW4gaW1tdXRhYmxlIHJlY29yZC5cIilcbiAgfVxuICB0aGlzLnNldChrZXksIHZhbHVlKVxufVxuXG5cbmNvbnN0ICRzdG9yZSA9IFR5cGVkLnN0b3JlXG5jb25zdCAkdHlwZSA9IFR5cGVkLnR5cGVcbmNvbnN0ICRzdGVwID0gVHlwZWQuc3RlcFxuY29uc3QgJGluaXQgPSBUeXBlZC5pbml0XG5jb25zdCAkcmVzdWx0ID0gVHlwZWQucmVzdWx0XG5jb25zdCAkcmVhZCA9IFR5cGVkLnJlYWRcbmNvbnN0ICRsYWJlbCA9IFR5cGVkLmxhYmVsXG5jb25zdCAkZW1wdHkgPSBUeXBlZC5lbXB0eVxuY29uc3QgJHR5cGVOYW1lID0gVHlwZWQudHlwZU5hbWVcbmNvbnN0ICR0eXBlU2lnbmF0dXJlID0gVHlwZWQudHlwZVNpZ25hdHVyZVxuXG5jb25zdCBJdGVyYWJsZUtleWVkQmFzZSA9IGZ1bmN0aW9uKCkge31cbkl0ZXJhYmxlS2V5ZWRCYXNlLnByb3RvdHlwZSA9IEl0ZXJhYmxlLktleWVkLnByb3RvdHlwZVxuXG5cbmNsYXNzIFR5cGVkUmVjb3JkIGV4dGVuZHMgSXRlcmFibGVLZXllZEJhc2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG4gIH1cbiAgW1R5cGVkLmluaXRdKCkge1xuICAgIHJldHVybiBjb25zdHJ1Y3QodGhpcykuYXNNdXRhYmxlKClcbiAgfVxuICBbVHlwZWQucmVzdWx0XShyZXN1bHQpIHtcbiAgICByZXR1cm4gcmVzdWx0LmFzSW1tdXRhYmxlKClcbiAgfVxuXG4gIFtUeXBlZC5yZWFkXShzdHJ1Y3R1cmUpIHtcbiAgICBjb25zdCBUeXBlID0gdGhpcy5jb25zdHJ1Y3RvclxuXG4gICAgaWYgKHN0cnVjdHVyZSAmJiBzdHJ1Y3R1cmUgaW5zdGFuY2VvZiBUeXBlKSB7XG4gICAgICByZXR1cm4gc3RydWN0dXJlXG4gICAgfVxuXG4gICAgaWYgKHN0cnVjdHVyZSA9PT0gbnVsbCB8fCAoc3RydWN0dXJlICYmIHR5cGVvZihzdHJ1Y3R1cmUpICE9PSBcIm9iamVjdFwiKSkge1xuICAgICAgcmV0dXJuIFR5cGVFcnJvcihgSW52YWxpZCBkYXRhIHN0cnVjdHVyZSBcIiR7c3RydWN0dXJlfVwiIHdhcyBwYXNzZWQgdG8gJHt0aGlzWyR0eXBlTmFtZV0oKX1gKVxuICAgIH1cblxuICAgIGNvbnN0IHNlcSA9IFNlcShzdHJ1Y3R1cmUpXG4gICAgY29uc3QgdHlwZSA9IHRoaXNbJHR5cGVdXG4gICAgY29uc3QgaXNFbXB0eSA9IHNlcS5zaXplID09PSAwXG5cblxuICAgIGlmIChpc0VtcHR5ICYmIHRoaXNbJGVtcHR5XSkge1xuICAgICAgcmV0dXJuIHRoaXNbJGVtcHR5XVxuICAgIH1cblxuICAgIGxldCByZWNvcmRcbiAgICBmb3IgKGxldCBrZXkgaW4gdHlwZSkge1xuICAgICAgY29uc3QgZmllbGRUeXBlID0gdHlwZVtrZXldXG4gICAgICBjb25zdCB2YWx1ZSA9IHNlcS5oYXMoa2V5KSA/IHNlcS5nZXQoa2V5KSA6IHRoaXMuZ2V0KGtleSlcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGZpZWxkVHlwZVskcmVhZF0odmFsdWUpXG5cbiAgICAgIGlmIChmaWVsZFR5cGUgIT09IEFueSAmJiByZXN1bHQgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIFR5cGVFcnJvcihgSW52YWxpZCB2YWx1ZSBmb3IgXCIke2tleX1cIiBmaWVsZDpcXG4gJHtyZXN1bHQubWVzc2FnZX1gKVxuICAgICAgfVxuXG4gICAgICByZWNvcmQgPSB0aGlzWyRzdGVwXShyZWNvcmQgfHwgdGhpc1skaW5pdF0oKSwgW2tleSwgcmVzdWx0XSlcbiAgICB9XG5cbiAgICByZWNvcmQgPSB0aGlzWyRyZXN1bHRdKHJlY29yZClcblxuICAgaWYgKGlzRW1wdHkpIHtcbiAgICAgIHRoaXNbJGVtcHR5XSA9IHJlY29yZFxuICAgIH1cblxuICAgIHJldHVybiByZWNvcmRcbiAgfVxuICBbVHlwZWQuc3RlcF0ocmVzdWx0LCBba2V5LCB2YWx1ZV0pIHtcbiAgICBjb25zdCBzdG9yZSA9IHJlc3VsdFskc3RvcmVdID8gcmVzdWx0WyRzdG9yZV0uc2V0KGtleSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgIG5ldyBNYXAoW1trZXksIHZhbHVlXV0pXG5cbiAgICBpZiAocmVzdWx0WyRzdG9yZV0gPT09IHN0b3JlKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGNvbnN0IHJlY29yZCA9IHJlc3VsdC5fX293bmVySUQgPyByZXN1bHQgOiBjb25zdHJ1Y3QocmVzdWx0KVxuICAgIHJlY29yZFskc3RvcmVdID0gc3RvcmVcblxuICAgIHJldHVybiByZWNvcmRcbiAgfVxuXG4gIFtUeXBlZC50eXBlU2lnbmF0dXJlXSgpIHtcbiAgICBjb25zdCB0eXBlID0gdGhpc1skdHlwZV1cbiAgICBjb25zdCBib2R5ID0gW11cbiAgICBmb3IgKGxldCBrZXkgaW4gdHlwZSkge1xuICAgICAgYm9keS5wdXNoKGAke2tleX06ICR7dHlwZVtrZXldWyR0eXBlTmFtZV0oKX1gKVxuICAgIH1cblxuICAgIHJldHVybiBgVHlwZWQuUmVjb3JkKHske2JvZHkuam9pbignLCAnKX19KWBcbiAgfVxuXG4gIFtUeXBlZC50eXBlTmFtZV0oKSB7XG4gICAgcmV0dXJuIHRoaXNbJGxhYmVsXSB8fCB0aGlzWyR0eXBlU2lnbmF0dXJlXSgpXG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5fX3RvU3RyaW5nKHRoaXNbJHR5cGVOYW1lXSgpICsgJyh7JywgJ30pJylcbiAgfVxuXG4gIGhhcyhrZXkpIHtcbiAgICByZXR1cm4gISF0aGlzWyR0eXBlXVtrZXldXG4gIH1cblxuICBnZXQoa2V5LCBkZWZhdWx0VmFsdWUpIHtcbiAgICByZXR1cm4gIXRoaXNbJHR5cGVdW2tleV0gPyBkZWZhdWx0VmFsdWUgOlxuICAgICAgICAgICAhdGhpc1skc3RvcmVdID8gZGVmYXVsdFZhbHVlIDpcbiAgICAgICAgICAgdGhpc1skc3RvcmVdLmdldChrZXksIGRlZmF1bHRWYWx1ZSk7XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICBpZiAodGhpcy5fX293bmVySUQpIHtcbiAgICAgIHRoaXNbJHN0b3JlXSAmJiB0aGlzWyRzdG9yZV0uY2xlYXIoKVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1skZW1wdHldIHx8XG4gICAgICAgICAgICh0aGlzWyRlbXB0eV0gPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcigpKVxuICB9XG5cbiAgcmVtb3ZlKGtleSkge1xuICAgIHJldHVybiB0aGlzWyR0eXBlXVtrZXldID8gdGhpcy5zZXQoa2V5LCB2b2lkKDApKSA6IHRoaXNcbiAgfVxuXG4gIHNldChrZXksIHZhbHVlKSB7XG4gICAgY29uc3QgZmllbGRUeXBlID0gdGhpc1skdHlwZV1ba2V5XVxuXG4gICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcihgQ2Fubm90IHNldCB1bmtub3duIGZpZWxkIFwiJHtrZXl9XCIgb24gXCIke3RoaXNbJHR5cGVOYW1lXSgpfVwiYClcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBmaWVsZFR5cGVbJHJlYWRdKHZhbHVlKVxuXG4gICAgaWYgKGZpZWxkVHlwZSAhPT0gQW55ICYmIHJlc3VsdCBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciAke2tleX0gZmllbGQ6ICR7cmVzdWx0Lm1lc3NhZ2V9YClcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1skc3RlcF0odGhpcywgW2tleSwgcmVzdWx0XSlcbiAgfVxuICBfX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpIHtcbiAgICByZXR1cm4gS2V5ZWQodGhpc1skdHlwZV0pLm1hcCgoXywga2V5KSA9PiB0aGlzLmdldChrZXkpKS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICB9XG5cbiAgX19pdGVyYXRlKGYsIHJldmVyc2UpIHtcbiAgICByZXR1cm4gS2V5ZWQodGhpc1skdHlwZV0pLm1hcCgoXywga2V5KSA9PiB0aGlzLmdldChrZXkpKS5fX2l0ZXJhdGUoZiwgcmV2ZXJzZSk7XG4gIH1cblxuICBfX2Vuc3VyZU93bmVyKG93bmVySUQpIHtcbiAgICBpZiAob3duZXJJRCA9PT0gdGhpcy5fX293bmVySUQpIHtcbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgY29uc3Qgc3RvcmUgPSB0aGlzWyRzdG9yZV0gJiYgdGhpc1skc3RvcmVdLl9fZW5zdXJlT3duZXIob3duZXJJRClcbiAgICBjb25zdCByZXN1bHQgPSAhb3duZXJJRCA/IHRoaXMgOiBjb25zdHJ1Y3QodGhpcylcblxuICAgIHJlc3VsdC5fX293bmVySUQgPSBvd25lcklEXG4gICAgcmVzdWx0WyRzdG9yZV0gPSBzdG9yZVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICB3YXNBbHRlcmVkKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV0ud2FzQWx0ZXJlZCgpXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFJlY29yZCA9IGZ1bmN0aW9uKGRlc2NyaXB0b3IsIGxhYmVsKSB7XG4gIGlmIChkZXNjcmlwdG9yICYmIHR5cGVvZihkZXNjcmlwdG9yKSA9PT0gXCJvYmplY3RcIikge1xuICAgIGNvbnN0IHR5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGRlc2NyaXB0b3IpXG4gICAgY29uc3Qgc2l6ZSA9IGtleXMubGVuZ3RoXG5cbiAgICBpZiAoc2l6ZSA+IDApIHtcbiAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSB7XG4gICAgICAgIHNpemU6IHt2YWx1ZTogc2l6ZX0sXG4gICAgICAgIFskdHlwZV06IHt2YWx1ZTogdHlwZX0sXG4gICAgICAgIFskbGFiZWxdOiB7dmFsdWU6IGxhYmVsfVxuICAgICAgfVxuXG4gICAgICBsZXQgaW5kZXggPSAwXG4gICAgICB3aGlsZSAoaW5kZXggPCBzaXplKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGtleXNbaW5kZXhdXG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IHR5cGVPZihkZXNjcmlwdG9yW2tleV0pXG5cbiAgICAgICAgaWYgKGZpZWxkVHlwZSkge1xuICAgICAgICAgIHR5cGVba2V5XSA9IGZpZWxkVHlwZVxuICAgICAgICAgIHByb3BlcnRpZXNba2V5XSA9IHtnZXQ6R2V0dGVyKGtleSksIHNldDpTZXR0ZXIoa2V5KSwgZW51bWVyYWJsZTogdHJ1ZX1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoYEludmFsaWQgZmllbGQgZGVzY3JpcHRvciBwcm92aWRlZCBmb3IgYSBcIiR7a2V5fVwiIGZpZWxkYClcbiAgICAgICAgfVxuXG4gICAgICAgIGluZGV4ID0gaW5kZXggKyAxXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IFJlY29yZFR5cGUgPSBmdW5jdGlvbihzdHJ1Y3R1cmUpIHtcbiAgICAgICAgY29uc3QgaXNOZXcgPSB0aGlzIGluc3RhbmNlb2YgUmVjb3JkVHlwZVxuICAgICAgICBjb25zdCBjb25zdHJ1Y3RvciA9IGlzTmV3ID8gdGhpcy5jb25zdHJ1Y3RvciA6IFJlY29yZFR5cGVcblxuICAgICAgICBpZiAoc3RydWN0dXJlIGluc3RhbmNlb2YgY29uc3RydWN0b3IpIHtcbiAgICAgICAgICByZXR1cm4gc3RydWN0dXJlXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0eXBlID0gY29uc3RydWN0b3IucHJvdG90eXBlXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHR5cGVbJHJlYWRdKHN0cnVjdHVyZSlcblxuICAgICAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgICAgICAgdGhyb3cgcmVzdWx0XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNOZXcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV0gPSByZXN1bHRbJHN0b3JlXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBwcm9wZXJ0aWVzLmNvbnN0cnVjdG9yID0ge3ZhbHVlOiBSZWNvcmRUeXBlfVxuICAgICAgUmVjb3JkVHlwZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlY29yZFByb3RvdHlwZSwgcHJvcGVydGllcylcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IFJlY29yZFR5cGUucHJvdG90eXBlXG5cbiAgICAgIHJldHVybiBSZWNvcmRUeXBlXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcihgVHlwZWQuUmVjb3JkIGRlc2NyaXB0b3IgbXVzdCBkZWZpbmUgYXQgbGVhc3Qgb25lIGZpZWxkYClcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKGBUeXBlZC5SZWNvcmQgbXVzdCBiZSBwYXNzZWQgYSBkZXNjcmlwdG9yIG9mIGZpZWxkc2ApXG4gIH1cbn1cblJlY29yZC5UeXBlID0gVHlwZWRSZWNvcmRcblJlY29yZC5wcm90b3R5cGUgPSBUeXBlZFJlY29yZC5wcm90b3R5cGVcbmNvbnN0IFJlY29yZFByb3RvdHlwZSA9IFR5cGVkUmVjb3JkLnByb3RvdHlwZVxuXG5cblJlY29yZFByb3RvdHlwZVtUeXBlZC5ERUxFVEVdID0gUmVjb3JkUHJvdG90eXBlLnJlbW92ZVxuXG4vLyBMYXJnZSBwYXJ0IG9mIHRoZSBSZWNvcmQgQVBJIGlzIGltcGxlbWVudGVkIGJ5IEltbXV0YWJlbC5NYXBcbi8vIGFuZCBpcyBqdXN0IGNvcGllZCBvdmVyLlxuUmVjb3JkUHJvdG90eXBlLmRlbGV0ZUluID0gTWFwLnByb3RvdHlwZS5kZWxldGVJblxuUmVjb3JkUHJvdG90eXBlLnJlbW92ZUluID0gTWFwLnByb3RvdHlwZS5yZW1vdmVJblxuUmVjb3JkUHJvdG90eXBlLm1lcmdlID0gTWFwLnByb3RvdHlwZS5tZXJnZVxuUmVjb3JkUHJvdG90eXBlLm1lcmdlV2l0aCA9IE1hcC5wcm90b3R5cGUubWVyZ2VXaXRoXG5SZWNvcmRQcm90b3R5cGUubWVyZ2VJbiA9IE1hcC5wcm90b3R5cGUubWVyZ2VJblxuUmVjb3JkUHJvdG90eXBlLm1lcmdlRGVlcCA9IE1hcC5wcm90b3R5cGUubWVyZ2VEZWVwXG5SZWNvcmRQcm90b3R5cGUubWVyZ2VEZWVwV2l0aCA9IE1hcC5wcm90b3R5cGUubWVyZ2VEZWVwV2l0aFxuUmVjb3JkUHJvdG90eXBlLm1lcmdlRGVlcEluID0gTWFwLnByb3RvdHlwZS5tZXJnZURlZXBJblxuUmVjb3JkUHJvdG90eXBlLnNldEluID0gTWFwLnByb3RvdHlwZS5zZXRJblxuUmVjb3JkUHJvdG90eXBlLnVwZGF0ZSA9IE1hcC5wcm90b3R5cGUudXBkYXRlXG5SZWNvcmRQcm90b3R5cGUudXBkYXRlSW4gPSBNYXAucHJvdG90eXBlLnVwZGF0ZUluXG5SZWNvcmRQcm90b3R5cGUud2l0aE11dGF0aW9ucyA9IE1hcC5wcm90b3R5cGUud2l0aE11dGF0aW9uc1xuUmVjb3JkUHJvdG90eXBlLmFzTXV0YWJsZSA9IE1hcC5wcm90b3R5cGUuYXNNdXRhYmxlXG5SZWNvcmRQcm90b3R5cGUuYXNJbW11dGFibGUgPSBNYXAucHJvdG90eXBlLmFzSW1tdXRhYmxlXG5cbi8vIExhcmdlIGNodWNrIG9mIEFQSSBpbmhlcml0ZWQgZnJvbSBJdGVyYWJsZSBkb2VzIG5vdCBtYWtlc1xuLy8gbXVjaCBzZW5zZSBpbiB0aGUgY29udGV4dCBvZiByZWNvcmRzIHNvIHdlIHVuZGVmaW5lIGl0LlxuUmVjb3JkUHJvdG90eXBlLm1hcCA9IHZvaWQoMClcblJlY29yZFByb3RvdHlwZS5maWx0ZXIgPSB2b2lkKDApXG5SZWNvcmRQcm90b3R5cGUuZmlsdGVyTm90ID0gdm9pZCgwKVxuUmVjb3JkUHJvdG90eXBlLmZsaXAgPSB2b2lkKDApXG5SZWNvcmRQcm90b3R5cGUubWFwS2V5cyA9IHZvaWQoMClcblJlY29yZFByb3RvdHlwZS5tYXBFbnRyaWVzID0gdm9pZCgwKVxuUmVjb3JkUHJvdG90eXBlLnNvcnQgPSB2b2lkKDApXG5SZWNvcmRQcm90b3R5cGUuc29ydEJ5ID0gdm9pZCgwKVxuUmVjb3JkUHJvdG90eXBlLnJldmVyc2UgPSB2b2lkKDApXG5SZWNvcmRQcm90b3R5cGUuc2xpY2UgPSB2b2lkKDApXG5SZWNvcmRQcm90b3R5cGUuYnV0TGFzdCA9IHZvaWQoMClcblJlY29yZFByb3RvdHlwZS5mbGF0TWFwID0gdm9pZCgwKVxuUmVjb3JkUHJvdG90eXBlLmZsYXR0ZW4gPSB2b2lkKDApXG5SZWNvcmRQcm90b3R5cGUucmVzdCA9IHZvaWQoMClcblJlY29yZFByb3RvdHlwZS5za2lwID0gdm9pZCgwKVxuUmVjb3JkUHJvdG90eXBlLnNraXBMYXN0ID0gdm9pZCgwKVxuUmVjb3JkUHJvdG90eXBlLnNraXBXaGlsZSA9IHZvaWQoMClcblJlY29yZFByb3RvdHlwZS5za2lwVW50aWwgPSB2b2lkKDApXG5SZWNvcmRQcm90b3R5cGUuc29ydEJ5ID0gdm9pZCgwKVxuUmVjb3JkUHJvdG90eXBlLnRha2UgPSB2b2lkKDApXG5SZWNvcmRQcm90b3R5cGUudGFrZUxhc3QgPSB2b2lkKDApXG5SZWNvcmRQcm90b3R5cGUudGFrZVdoaWxlID0gdm9pZCgwKVxuUmVjb3JkUHJvdG90eXBlLnRha2VVbnRpbCA9IHZvaWQoMClcbiJdfQ==