(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', './typed', 'immutable'], factory);
  } else if (typeof exports !== 'undefined') {
    factory(exports, require('./typed'), require('immutable'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.typed, global.Immutable);
    global.list = mod.exports;
  }
})(this, function (exports, _typed, _immutable) {
  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

  function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

  var ImmutableList = _immutable.List;
  var Indexed = _immutable.Iterable.Indexed;

  var $store = _typed.Typed.store;
  var $type = _typed.Typed.type;
  var $read = _typed.Typed.read;
  var $step = _typed.Typed.step;
  var $init = _typed.Typed.init;
  var $result = _typed.Typed.result;
  var $label = _typed.Typed.label;
  var $typeName = _typed.Typed.typeName;
  var $empty = _typed.Typed.empty;

  var change = function change(list, f) {
    var store = f(list[$store]);
    if (store === list[$store]) {
      return list;
    } else {
      var result = list.__ownerID ? list : (0, _typed.construct)(list);
      result[$store] = store;
      result.size = store.size;
      return result;
    }
  };

  var maxSizeFromIterables = function maxSizeFromIterables(iterables) {
    var maxSize = 0;
    for (var i = 0; i < iterables.length; i++) {
      var iter = Indexed(iterables[i]);
      if (iter.size > maxSize) {
        maxSize = iter.size;
      }
    }
    return maxSize;
  };

  var convertValuesToType = function convertValuesToType(type, values) {
    var items = [];
    var iter = Indexed(values);
    var index = 0;
    while (index < iter.size) {
      var value = iter.get(index);
      var result = type[$read](value);

      if (result instanceof TypeError) {
        throw TypeError('Invalid value: ' + result.message);
      }

      items.push(result);
      index = index + 1;
    }
    return items;
  };

  var _clear = function _clear(target) {
    return target.clear();
  };
  var _pop = function _pop(target) {
    return target.pop();
  };
  var _shift = function _shift(target) {
    return target.shift();
  };

  var TypeInferer = (function (_Type) {
    _inherits(TypeInferer, _Type);

    function TypeInferer() {
      _classCallCheck(this, TypeInferer);

      _get(Object.getPrototypeOf(TypeInferer.prototype), 'constructor', this).apply(this, arguments);
    }

    _createClass(TypeInferer, [{
      key: _typed.Typed.typeName,
      value: function value() {
        return 'TypeInferer';
      }
    }, {
      key: _typed.Typed.read,
      value: function value(_value) {
        // typeOf usually creates type for the value with that
        // value being a default. For type inference we should
        // actually use a base type instead of type with default
        // there for we use prototype of the constructor.
        var type = (0, _typed.typeOf)(_value).constructor.prototype;
        this.type = this.type ? (0, _typed.Union)(this.type, type) : type;
        return _value;
      }
    }]);

    return TypeInferer;
  })(_typed.Type);

  function BaseImmutableList() {}
  BaseImmutableList.prototype = ImmutableList.prototype;

  var TypeInferedList = (function (_BaseImmutableList) {
    _inherits(TypeInferedList, _BaseImmutableList);

    _createClass(TypeInferedList, null, [{
      key: 'from',
      value: function from(list) {
        var result = (0, _typed.construct)(this.prototype);
        result[$store] = list[$store];
        result.size = list.size;
        return result;
      }
    }]);

    function TypeInferedList(value) {
      _classCallCheck(this, TypeInferedList);

      _get(Object.getPrototypeOf(TypeInferedList.prototype), 'constructor', this).call(this);
      return TypeInferedList.prototype[$read](value);
    }

    _createClass(TypeInferedList, [{
      key: _typed.Typed.init,
      value: function value() {
        var result = (0, _typed.construct)(this).asMutable();
        result[$type] = new TypeInferer();
        return result;
      }
    }, {
      key: _typed.Typed.result,
      value: function value(result) {
        var list = result.asImmutable();
        list[$type] = result[$type].type;

        return list;
      }
    }, {
      key: _typed.Typed.read,
      value: function value(input) {
        var Type = this.constructor;

        if (input === null || input === void 0) {
          if (!this[$empty]) {
            var result = (0, _typed.construct)(this);
            result[$store] = ImmutableList();
            result.size = 0;
            this[$empty] = result;
          }

          return this[$empty];
        }

        if (input instanceof Type && input && input.constructor === Type) {
          return input;
        }

        var source = Indexed(input);
        var isEmpty = source.size === 0;

        if (isEmpty && this[$empty]) {
          return this[$empty];
        }

        var list = this[$init]();
        list.size = source.size;
        source.forEach(function (value, index) {
          list.set(index, value);
        });

        list = this[$result](list);

        if (isEmpty) {
          this[$empty] = list;
        }

        return list;
      }
    }, {
      key: _typed.Typed.step,
      value: function value(result, _ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var key = _ref2[0];
        var _value2 = _ref2[1];

        return change(result, function () {
          var store = arguments.length <= 0 || arguments[0] === undefined ? ImmutableList() : arguments[0];
          return store.set(key, _value2);
        });
      }
    }, {
      key: _typed.Typed.typeName,
      value: function value() {
        return this[$label] || 'Typed.List(' + this[$type][$typeName]() + ')';
      }
    }, {
      key: 'toString',
      value: function toString() {
        return this.__toString(this[$typeName]() + '([', '])');
      }
    }, {
      key: 'has',
      value: function has(key) {
        return this[$store].has(key);
      }
    }, {
      key: 'get',
      value: function get(index, notSetValue) {
        return this[$store] ? this[$store].get(parseInt(index), notSetValue) : notSetValue;
      }
    }, {
      key: 'clear',
      value: function clear() {
        if (this.__ownerID) {
          return change(this, _clear);
        }

        return this[$empty] || this[$read]();
      }
    }, {
      key: 'insert',
      value: function insert(index, value) {
        if (index > this.size) {
          throw TypeError('Index "' + index + '" is out of bounds.');
        }

        var result = this[$type][$read](value);

        if (result instanceof TypeError) {
          throw TypeError('Invalid value: ' + result.message);
        }

        return change(this, function (store) {
          return store.insert(index, value);
        });
      }
    }, {
      key: 'remove',
      value: function remove(index) {
        return change(this, function (store) {
          return store && store.remove(index);
        });
      }
    }, {
      key: 'set',
      value: function set(index, value) {
        if (index > this.size) {
          throw TypeError('Index "' + index + '" is out of bounds.');
        }

        var result = this[$type][$read](value);

        if (result instanceof TypeError) {
          throw TypeError('Invalid value: ' + result.message);
        }

        return this[$step](this, [index, result]);
      }
    }, {
      key: 'push',
      value: function push() {
        var type = this[$type];
        var items = [];

        for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
          values[_key] = arguments[_key];
        }

        var count = values.length;
        var index = 0;
        while (index < count) {
          var value = values[index];
          var result = type[$read](value);

          if (result instanceof TypeError) {
            throw TypeError('Invalid value: ' + result.message);
          }

          items.push(result);
          index = index + 1;
        }

        return change(this, function (store) {
          return store ? store.push.apply(store, items) : ImmutableList.apply(undefined, items);
        });
      }
    }, {
      key: 'pop',
      value: function pop() {
        return change(this, _pop);
      }
    }, {
      key: 'unshift',
      value: function unshift() {
        var type = this[$type];
        var items = [];

        for (var _len2 = arguments.length, values = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          values[_key2] = arguments[_key2];
        }

        var count = values.length;
        var index = 0;

        while (index < count) {
          var value = values[index];
          var result = type[$read](value);

          if (result instanceof TypeError) {
            throw TypeError('Invalid value: ' + result.message);
          }

          items.push(result);
          index = index + 1;
        }

        return change(this, function (store) {
          return store ? store.unshift.apply(store, items) : ImmutableList.apply(undefined, items);
        });
      }
    }, {
      key: 'shift',
      value: function shift() {
        return change(this, _shift);
      }
    }, {
      key: 'setSize',
      value: function setSize(size) {
        if (size > this.size) {
          throw TypeError('setSize may only downsize');
        }

        return change(this, function (store) {
          return store.setSize(size);
        });
      }
    }, {
      key: 'slice',
      value: function slice(begin, end) {
        return change(this, function (store) {
          return store && store.slice(begin, end);
        });
      }
    }, {
      key: 'wasAltered',
      value: function wasAltered() {
        return this[$store].wasAltered();
      }
    }, {
      key: 'merge',
      value: function merge() {
        for (var _len3 = arguments.length, iterables = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          iterables[_key3] = arguments[_key3];
        }

        var maxSize = maxSizeFromIterables(iterables);
        var typedIterables = iterables.map(convertValuesToType.bind(null, this[$type]));
        if (maxSize > this.size) {
          var _change;

          return (_change = change(this, function (store) {
            return store.setSize(maxSize);
          })).merge.apply(_change, _toConsumableArray(typedIterables));
        }
        return change(this, function (store) {
          return store.merge.apply(store, _toConsumableArray(typedIterables));
        });
      }
    }, {
      key: 'mergeWith',
      value: function mergeWith(merger) {
        for (var _len4 = arguments.length, iterables = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
          iterables[_key4 - 1] = arguments[_key4];
        }

        var maxSize = maxSizeFromIterables(iterables);
        var typedIterables = iterables.map(convertValuesToType.bind(null, this[$type]));
        if (maxSize > this.size) {
          return change(this, function (store) {
            var _store$setSize;

            return (_store$setSize = store.setSize(maxSize)).mergeWith.apply(_store$setSize, [merger].concat(_toConsumableArray(typedIterables)));
          });
        }
        return change(this, function (store) {
          return store.mergeWith.apply(store, [merger].concat(_toConsumableArray(typedIterables)));
        });
      }
    }, {
      key: 'mergeDeep',
      value: function mergeDeep() {
        for (var _len5 = arguments.length, iterables = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
          iterables[_key5] = arguments[_key5];
        }

        var maxSize = maxSizeFromIterables(iterables);
        var typedIterables = iterables.map(convertValuesToType.bind(null, this[$type]));
        if (maxSize > this.size) {
          return change(this, function (store) {
            var _store$setSize2;

            return (_store$setSize2 = store.setSize(maxSize)).mergeDeep.apply(_store$setSize2, _toConsumableArray(typedIterables));
          });
        }
        return change(this, function (store) {
          return store.mergeDeep.apply(store, _toConsumableArray(typedIterables));
        });
      }
    }, {
      key: 'mergeDeepWith',
      value: function mergeDeepWith(merger) {
        for (var _len6 = arguments.length, iterables = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
          iterables[_key6 - 1] = arguments[_key6];
        }

        var maxSize = maxSizeFromIterables(iterables);
        var typedIterables = iterables.map(convertValuesToType.bind(null, this[$type]));
        if (maxSize > this.size) {
          return change(this, function (store) {
            var _store$setSize3;

            return (_store$setSize3 = store.setSize(maxSize)).mergeDeepWith.apply(_store$setSize3, [merger].concat(_toConsumableArray(typedIterables)));
          });
        }
        return change(this, function (store) {
          return store.mergeDeepWith.apply(store, [merger].concat(_toConsumableArray(typedIterables)));
        });
      }
    }, {
      key: '__ensureOwner',
      value: function __ensureOwner(ownerID) {
        var result = this.__ownerID === ownerID ? this : !ownerID ? this : (0, _typed.construct)(this);

        result.__ownerID = ownerID;
        result[$store] = this[$store] ? this[$store].__ensureOwner(ownerID) : ImmutableList().__ensureOwner(ownerID);
        result.size = result[$store].size;

        return result;
      }
    }, {
      key: '__iterator',
      value: function __iterator(type, reverse) {
        var _this = this;

        return Indexed(this[$store]).map(function (_, key) {
          return _this.get(key);
        }).__iterator(type, reverse);
      }
    }, {
      key: '__iterate',
      value: function __iterate(f, reverse) {
        var _this2 = this;

        return Indexed(this[$store]).map(function (_, key) {
          return _this2.get(key);
        }).__iterate(f, reverse);
      }
    }]);

    return TypeInferedList;
  })(BaseImmutableList);

  TypeInferedList.prototype[_typed.Typed.DELETE] = TypeInferedList.prototype.remove;

  var BaseTypeInferedList = function BaseTypeInferedList() {};
  BaseTypeInferedList.prototype = TypeInferedList.prototype;

  var TypedList = (function (_BaseTypeInferedList) {
    _inherits(TypedList, _BaseTypeInferedList);

    function TypedList() {
      _classCallCheck(this, TypedList);

      _get(Object.getPrototypeOf(TypedList.prototype), 'constructor', this).call(this);
    }

    _createClass(TypedList, [{
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
      key: 'map',
      value: function map(mapper, context) {
        if (this.size === 0) {
          return this;
        } else {
          var result = TypeInferedList.from(this).map(mapper, context);
          if (this[$store] === result[$store]) {
            return this;
          }
          if (result[$type] === this[$type]) {
            var list = (0, _typed.construct)(this);
            list[$store] = result[$store];
            list.size = result.size;
            return list;
          } else {
            return result;
          }
        }
      }
    }, {
      key: 'flatMap',
      value: function flatMap(mapper, context) {
        if (this.size === 0) {
          return this;
        } else {
          var result = TypeInferedList.from(this).flatMap(mapper, context);
          if (this[$store] === result[$store]) {
            return this;
          }
          if (result[$type] === this[$type]) {
            var list = (0, _typed.construct)(this);
            list[$store] = result[$store];
            list.size = result.size;
            return list;
          } else {
            return result;
          }
        }
      }
    }]);

    return TypedList;
  })(BaseTypeInferedList);

  var List = function List(descriptor, label) {
    var _Object$create;

    if (descriptor === void 0) {
      throw TypeError("Typed.List must be passed a type descriptor");
    }

    if (descriptor === _typed.Any) {
      return _immutable.List;
    }

    var type = (0, _typed.typeOf)(descriptor);

    if (type === _typed.Any) {
      throw TypeError('Typed.List was passed an invalid type descriptor: ' + descriptor);
    }

    var ListType = function ListType(value) {
      var isListType = this instanceof ListType;
      var Type = isListType ? this.constructor : ListType;

      if (value instanceof Type) {
        return value;
      }

      var result = Type.prototype[$read](value);

      if (result instanceof TypeError) {
        throw result;
      }

      // `list.map(f)` will in fact cause `list.constructor(items)` to be
      // invoked there for we need to check if `this[$store]` was
      // assigned to know if it's that or if it's a `new ListType()` call.
      if (isListType && !this[$store]) {
        this[$store] = result[$store];
        this.size = result.size;
      } else {
        return result;
      }

      return this;
    };
    ListType.of = ImmutableList.of;
    ListType.prototype = Object.create(ListPrototype, (_Object$create = {
      constructor: { value: ListType }
    }, _defineProperty(_Object$create, $type, { value: type }), _defineProperty(_Object$create, $label, { value: label }), _Object$create));

    return ListType;
  };
  exports.List = List;
  List.Type = TypedList;
  List.prototype = TypedList.prototype;
  var ListPrototype = TypedList.prototype;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQzlDLGlCQUFXLEVBQUUsRUFBQyxLQUFLLEVBQUUsUUFBUSxFQUFDO3VDQUM3QixLQUFLLEVBQUcsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFDLG1DQUNyQixNQUFNLEVBQUcsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLG1CQUN4QixDQUFBOztBQUVGLFdBQU8sUUFBUSxDQUFBO0dBQ2hCLENBQUE7O0FBQ0QsTUFBSSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUE7QUFDckIsTUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFBO0FBQ3BDLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUEiLCJmaWxlIjoibGlzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7VHlwZWQsIFR5cGUsIFVuaW9uLCBBbnksIHR5cGVPZiwgY29uc3RydWN0fSBmcm9tIFwiLi90eXBlZFwiXG5pbXBvcnQgKiBhcyBJbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJ1xuXG5cbmNvbnN0IEltbXV0YWJsZUxpc3QgPSBJbW11dGFibGUuTGlzdFxuY29uc3Qge0luZGV4ZWR9ID0gSW1tdXRhYmxlLkl0ZXJhYmxlXG5cbmNvbnN0ICRzdG9yZSA9IFR5cGVkLnN0b3JlXG5jb25zdCAkdHlwZSA9IFR5cGVkLnR5cGVcbmNvbnN0ICRyZWFkID0gVHlwZWQucmVhZFxuY29uc3QgJHN0ZXAgPSBUeXBlZC5zdGVwXG5jb25zdCAkaW5pdCA9IFR5cGVkLmluaXRcbmNvbnN0ICRyZXN1bHQgPSBUeXBlZC5yZXN1bHRcbmNvbnN0ICRsYWJlbCA9IFR5cGVkLmxhYmVsXG5jb25zdCAkdHlwZU5hbWUgPSBUeXBlZC50eXBlTmFtZVxuY29uc3QgJGVtcHR5ID0gVHlwZWQuZW1wdHlcblxuXG5jb25zdCBjaGFuZ2UgPSAobGlzdCwgZikgPT4ge1xuICBjb25zdCBzdG9yZSA9IGYobGlzdFskc3RvcmVdKVxuICBpZiAoc3RvcmUgPT09IGxpc3RbJHN0b3JlXSkge1xuICAgIHJldHVybiBsaXN0XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcmVzdWx0ID0gbGlzdC5fX293bmVySUQgPyBsaXN0IDogY29uc3RydWN0KGxpc3QpXG4gICAgcmVzdWx0WyRzdG9yZV0gPSBzdG9yZVxuICAgIHJlc3VsdC5zaXplID0gc3RvcmUuc2l6ZVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxufVxuXG5jb25zdCBtYXhTaXplRnJvbUl0ZXJhYmxlcyA9IChpdGVyYWJsZXMpID0+IHtcbiAgICBsZXQgbWF4U2l6ZSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYWJsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZXIgPSBJbmRleGVkKGl0ZXJhYmxlc1tpXSk7XG4gICAgICBpZiAoaXRlci5zaXplID4gbWF4U2l6ZSkge1xuICAgICAgICBtYXhTaXplID0gaXRlci5zaXplO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF4U2l6ZTtcbn1cblxuY29uc3QgY29udmVydFZhbHVlc1RvVHlwZSA9ICh0eXBlLCB2YWx1ZXMpID0+IHtcbiAgY29uc3QgaXRlbXMgPSBbXVxuICBjb25zdCBpdGVyID0gSW5kZXhlZCh2YWx1ZXMpO1xuICBsZXQgaW5kZXggPSAwXG4gIHdoaWxlIChpbmRleCA8IGl0ZXIuc2l6ZSkge1xuICAgIGNvbnN0IHZhbHVlID0gaXRlci5nZXQoaW5kZXgpXG4gICAgY29uc3QgcmVzdWx0ID0gdHlwZVskcmVhZF0odmFsdWUpXG5cbiAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoYEludmFsaWQgdmFsdWU6ICR7cmVzdWx0Lm1lc3NhZ2V9YClcbiAgICB9XG5cbiAgICBpdGVtcy5wdXNoKHJlc3VsdClcbiAgICBpbmRleCA9IGluZGV4ICsgMVxuICB9XG4gIHJldHVybiBpdGVtcztcbn1cblxuY29uc3QgY2xlYXIgPSB0YXJnZXQgPT4gdGFyZ2V0LmNsZWFyKClcbmNvbnN0IHBvcCA9IHRhcmdldCA9PiB0YXJnZXQucG9wKClcbmNvbnN0IHNoaWZ0ID0gdGFyZ2V0ID0+IHRhcmdldC5zaGlmdCgpXG5cbmNsYXNzIFR5cGVJbmZlcmVyIGV4dGVuZHMgVHlwZSB7XG4gIFtUeXBlZC50eXBlTmFtZV0oKSB7XG4gICAgcmV0dXJuICdUeXBlSW5mZXJlcidcbiAgfVxuICBbVHlwZWQucmVhZF0odmFsdWUpIHtcbiAgICAvLyB0eXBlT2YgdXN1YWxseSBjcmVhdGVzIHR5cGUgZm9yIHRoZSB2YWx1ZSB3aXRoIHRoYXRcbiAgICAvLyB2YWx1ZSBiZWluZyBhIGRlZmF1bHQuIEZvciB0eXBlIGluZmVyZW5jZSB3ZSBzaG91bGRcbiAgICAvLyBhY3R1YWxseSB1c2UgYSBiYXNlIHR5cGUgaW5zdGVhZCBvZiB0eXBlIHdpdGggZGVmYXVsdFxuICAgIC8vIHRoZXJlIGZvciB3ZSB1c2UgcHJvdG90eXBlIG9mIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICBjb25zdCB0eXBlID0gdHlwZU9mKHZhbHVlKS5jb25zdHJ1Y3Rvci5wcm90b3R5cGVcbiAgICB0aGlzLnR5cGUgPSB0aGlzLnR5cGUgPyBVbmlvbih0aGlzLnR5cGUsIHR5cGUpIDogdHlwZVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG59XG5cbmZ1bmN0aW9uIEJhc2VJbW11dGFibGVMaXN0KCkge31cbkJhc2VJbW11dGFibGVMaXN0LnByb3RvdHlwZSA9IEltbXV0YWJsZUxpc3QucHJvdG90eXBlXG5cbmNsYXNzIFR5cGVJbmZlcmVkTGlzdCBleHRlbmRzIEJhc2VJbW11dGFibGVMaXN0IHtcbiAgc3RhdGljIGZyb20obGlzdCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGNvbnN0cnVjdCh0aGlzLnByb3RvdHlwZSlcbiAgICByZXN1bHRbJHN0b3JlXSA9IGxpc3RbJHN0b3JlXVxuICAgIHJlc3VsdC5zaXplID0gbGlzdC5zaXplXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGNvbnN0cnVjdG9yKHZhbHVlKSB7XG4gICAgc3VwZXIoKTtcbiAgICByZXR1cm4gVHlwZUluZmVyZWRMaXN0LnByb3RvdHlwZVskcmVhZF0odmFsdWUpXG4gIH1cbiAgW1R5cGVkLmluaXRdKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGNvbnN0cnVjdCh0aGlzKS5hc011dGFibGUoKVxuICAgIHJlc3VsdFskdHlwZV0gPSBuZXcgVHlwZUluZmVyZXIoKVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBbVHlwZWQucmVzdWx0XShyZXN1bHQpIHtcbiAgICBjb25zdCBsaXN0ID0gcmVzdWx0LmFzSW1tdXRhYmxlKClcbiAgICBsaXN0WyR0eXBlXSA9IHJlc3VsdFskdHlwZV0udHlwZVxuXG4gICAgcmV0dXJuIGxpc3RcbiAgfVxuXG4gIFtUeXBlZC5yZWFkXShpbnB1dCkge1xuICAgIGNvbnN0IFR5cGUgPSB0aGlzLmNvbnN0cnVjdG9yXG5cbiAgICBpZiAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHZvaWQoMCkpIHtcbiAgICAgIGlmICghdGhpc1skZW1wdHldKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbnN0cnVjdCh0aGlzKVxuICAgICAgICByZXN1bHRbJHN0b3JlXSA9IEltbXV0YWJsZUxpc3QoKVxuICAgICAgICByZXN1bHQuc2l6ZSA9IDBcbiAgICAgICAgdGhpc1skZW1wdHldID0gcmVzdWx0XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzWyRlbXB0eV1cbiAgICB9XG5cbiAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBUeXBlICYmIGlucHV0ICYmIGlucHV0LmNvbnN0cnVjdG9yID09PSBUeXBlKSB7XG4gICAgICByZXR1cm4gaW5wdXRcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2UgPSBJbmRleGVkKGlucHV0KVxuICAgIGNvbnN0IGlzRW1wdHkgPSBzb3VyY2Uuc2l6ZSA9PT0gMFxuXG4gICAgaWYgKGlzRW1wdHkgJiYgdGhpc1skZW1wdHldKSB7XG4gICAgICByZXR1cm4gdGhpc1skZW1wdHldXG4gICAgfVxuXG5cbiAgICBsZXQgbGlzdCA9IHRoaXNbJGluaXRdKClcbiAgICBsaXN0LnNpemUgPSBzb3VyY2Uuc2l6ZVxuICAgIHNvdXJjZS5mb3JFYWNoKCh2YWx1ZSwgaW5kZXgpID0+IHtcbiAgICAgIGxpc3Quc2V0KGluZGV4LCB2YWx1ZSlcbiAgICB9KVxuXG4gICAgbGlzdCA9IHRoaXNbJHJlc3VsdF0obGlzdClcblxuICAgIGlmIChpc0VtcHR5KSB7XG4gICAgICB0aGlzWyRlbXB0eV0gPSBsaXN0XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpc3RcbiAgfVxuICBbVHlwZWQuc3RlcF0ocmVzdWx0LCBba2V5LCB2YWx1ZV0pIHtcbiAgICByZXR1cm4gY2hhbmdlKHJlc3VsdCwgKHN0b3JlPUltbXV0YWJsZUxpc3QoKSkgPT4gc3RvcmUuc2V0KGtleSwgdmFsdWUpKVxuICB9XG5cbiAgW1R5cGVkLnR5cGVOYW1lXSgpIHtcbiAgICByZXR1cm4gdGhpc1skbGFiZWxdIHx8IGBUeXBlZC5MaXN0KCR7dGhpc1skdHlwZV1bJHR5cGVOYW1lXSgpfSlgXG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5fX3RvU3RyaW5nKHRoaXNbJHR5cGVOYW1lXSgpICsgJyhbJywgJ10pJylcbiAgfVxuXG4gIGhhcyhrZXkpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdLmhhcyhrZXkpXG4gIH1cblxuICBnZXQoaW5kZXgsIG5vdFNldFZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXSA/IHRoaXNbJHN0b3JlXS5nZXQocGFyc2VJbnQoaW5kZXgpLCBub3RTZXRWYWx1ZSkgOlxuICAgICAgICAgICBub3RTZXRWYWx1ZVxuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgaWYgKHRoaXMuX19vd25lcklEKSB7XG4gICAgICByZXR1cm4gY2hhbmdlKHRoaXMsIGNsZWFyKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzWyRlbXB0eV0gfHwgdGhpc1skcmVhZF0oKVxuICB9XG5cbiAgaW5zZXJ0KGluZGV4LCB2YWx1ZSkge1xuICAgIGlmIChpbmRleCA+IHRoaXMuc2l6ZSkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKGBJbmRleCBcIiR7aW5kZXh9XCIgaXMgb3V0IG9mIGJvdW5kcy5gKVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXNbJHR5cGVdWyRyZWFkXSh2YWx1ZSlcblxuICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcihgSW52YWxpZCB2YWx1ZTogJHtyZXN1bHQubWVzc2FnZX1gKVxuICAgIH1cblxuICAgIHJldHVybiBjaGFuZ2UodGhpcywgc3RvcmUgPT4gc3RvcmUuaW5zZXJ0KGluZGV4LCB2YWx1ZSkpXG4gIH1cblxuICByZW1vdmUoaW5kZXgpIHtcbiAgICByZXR1cm4gY2hhbmdlKHRoaXMsIHN0b3JlID0+IHN0b3JlICYmIHN0b3JlLnJlbW92ZShpbmRleCkpXG4gIH1cblxuICBzZXQoaW5kZXgsIHZhbHVlKSB7XG4gICAgaWYgKGluZGV4ID4gdGhpcy5zaXplKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoYEluZGV4IFwiJHtpbmRleH1cIiBpcyBvdXQgb2YgYm91bmRzLmApXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdGhpc1skdHlwZV1bJHJlYWRdKHZhbHVlKVxuXG4gICAgaWYgKHJlc3VsdCBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlOiAke3Jlc3VsdC5tZXNzYWdlfWApXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNbJHN0ZXBdKHRoaXMsIFtpbmRleCwgcmVzdWx0XSlcbiAgfVxuXG4gIHB1c2goLi4udmFsdWVzKSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXNbJHR5cGVdXG4gICAgY29uc3QgaXRlbXMgPSBbXVxuICAgIGNvbnN0IGNvdW50ID0gdmFsdWVzLmxlbmd0aFxuICAgIGxldCBpbmRleCA9IDBcbiAgICB3aGlsZSAoaW5kZXggPCBjb3VudCkge1xuICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZXNbaW5kZXhdXG4gICAgICBjb25zdCByZXN1bHQgPSB0eXBlWyRyZWFkXSh2YWx1ZSlcblxuICAgICAgaWYgKHJlc3VsdCBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoYEludmFsaWQgdmFsdWU6ICR7cmVzdWx0Lm1lc3NhZ2V9YClcbiAgICAgIH1cblxuICAgICAgaXRlbXMucHVzaChyZXN1bHQpXG4gICAgICBpbmRleCA9IGluZGV4ICsgMVxuICAgIH1cblxuICAgIHJldHVybiBjaGFuZ2UodGhpcywgc3RvcmUgPT5cbiAgICAgIHN0b3JlID8gc3RvcmUucHVzaCguLi5pdGVtcykgOiBJbW11dGFibGVMaXN0KC4uLml0ZW1zKSlcbiAgfVxuICBwb3AoKSB7XG4gICAgcmV0dXJuIGNoYW5nZSh0aGlzLCBwb3ApXG4gIH1cbiAgdW5zaGlmdCguLi52YWx1ZXMpIHtcbiAgICBjb25zdCB0eXBlID0gdGhpc1skdHlwZV1cbiAgICBjb25zdCBpdGVtcyA9IFtdXG4gICAgY29uc3QgY291bnQgPSB2YWx1ZXMubGVuZ3RoXG4gICAgbGV0IGluZGV4ID0gMFxuXG4gICAgd2hpbGUgKGluZGV4IDwgY291bnQpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVzW2luZGV4XVxuICAgICAgY29uc3QgcmVzdWx0ID0gdHlwZVskcmVhZF0odmFsdWUpXG5cbiAgICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlOiAke3Jlc3VsdC5tZXNzYWdlfWApXG4gICAgICB9XG5cbiAgICAgIGl0ZW1zLnB1c2gocmVzdWx0KVxuICAgICAgaW5kZXggPSBpbmRleCArIDFcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhbmdlKHRoaXMsIHN0b3JlID0+XG4gICAgICBzdG9yZSA/IHN0b3JlLnVuc2hpZnQoLi4uaXRlbXMpIDogSW1tdXRhYmxlTGlzdCguLi5pdGVtcykpXG4gIH1cbiAgc2hpZnQoKSB7XG4gICAgcmV0dXJuIGNoYW5nZSh0aGlzLCBzaGlmdClcbiAgfVxuICBzZXRTaXplKHNpemUpIHtcbiAgICBpZiAoc2l6ZSA+IHRoaXMuc2l6ZSkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKGBzZXRTaXplIG1heSBvbmx5IGRvd25zaXplYClcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhbmdlKHRoaXMsIHN0b3JlID0+IHN0b3JlLnNldFNpemUoc2l6ZSkpXG4gIH1cbiAgc2xpY2UoYmVnaW4sIGVuZCkge1xuICAgIHJldHVybiBjaGFuZ2UodGhpcywgc3RvcmUgPT4gc3RvcmUgJiYgc3RvcmUuc2xpY2UoYmVnaW4sIGVuZCkpXG4gIH1cblxuICB3YXNBbHRlcmVkKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV0ud2FzQWx0ZXJlZCgpXG4gIH1cblxuICBtZXJnZSguLi5pdGVyYWJsZXMpIHtcbiAgICBjb25zdCBtYXhTaXplID0gbWF4U2l6ZUZyb21JdGVyYWJsZXMoaXRlcmFibGVzKTtcbiAgICBjb25zdCB0eXBlZEl0ZXJhYmxlcyA9IGl0ZXJhYmxlcy5tYXAoY29udmVydFZhbHVlc1RvVHlwZS5iaW5kKG51bGwsIHRoaXNbJHR5cGVdKSk7XG4gICAgaWYgKG1heFNpemUgPiB0aGlzLnNpemUpIHtcbiAgICAgIHJldHVybiBjaGFuZ2UodGhpcywgc3RvcmUgPT4gc3RvcmUuc2V0U2l6ZShtYXhTaXplKSkubWVyZ2UoLi4udHlwZWRJdGVyYWJsZXMpO1xuICAgIH1cbiAgICByZXR1cm4gY2hhbmdlKHRoaXMsIHN0b3JlID0+IHN0b3JlLm1lcmdlKC4uLnR5cGVkSXRlcmFibGVzKSk7XG4gIH1cblxuICBtZXJnZVdpdGgobWVyZ2VyLCAuLi5pdGVyYWJsZXMpIHtcbiAgICBjb25zdCBtYXhTaXplID0gbWF4U2l6ZUZyb21JdGVyYWJsZXMoaXRlcmFibGVzKTtcbiAgICBjb25zdCB0eXBlZEl0ZXJhYmxlcyA9IGl0ZXJhYmxlcy5tYXAoY29udmVydFZhbHVlc1RvVHlwZS5iaW5kKG51bGwsIHRoaXNbJHR5cGVdKSk7XG4gICAgaWYgKG1heFNpemUgPiB0aGlzLnNpemUpIHtcbiAgICAgIHJldHVybiBjaGFuZ2UodGhpcywgc3RvcmUgPT4gc3RvcmUuc2V0U2l6ZShtYXhTaXplKS5tZXJnZVdpdGgobWVyZ2VyLCAuLi50eXBlZEl0ZXJhYmxlcykpO1xuICAgIH1cbiAgICByZXR1cm4gY2hhbmdlKHRoaXMsIHN0b3JlID0+IHN0b3JlLm1lcmdlV2l0aChtZXJnZXIsIC4uLnR5cGVkSXRlcmFibGVzKSk7XG4gIH1cblxuICBtZXJnZURlZXAoLi4uaXRlcmFibGVzKSB7XG4gICAgY29uc3QgbWF4U2l6ZSA9IG1heFNpemVGcm9tSXRlcmFibGVzKGl0ZXJhYmxlcyk7XG4gICAgY29uc3QgdHlwZWRJdGVyYWJsZXMgPSBpdGVyYWJsZXMubWFwKGNvbnZlcnRWYWx1ZXNUb1R5cGUuYmluZChudWxsLCB0aGlzWyR0eXBlXSkpO1xuICAgIGlmIChtYXhTaXplID4gdGhpcy5zaXplKSB7XG4gICAgICByZXR1cm4gY2hhbmdlKHRoaXMsIHN0b3JlID0+IHN0b3JlLnNldFNpemUobWF4U2l6ZSkubWVyZ2VEZWVwKC4uLnR5cGVkSXRlcmFibGVzKSk7XG4gICAgfVxuICAgIHJldHVybiBjaGFuZ2UodGhpcywgc3RvcmUgPT4gc3RvcmUubWVyZ2VEZWVwKC4uLnR5cGVkSXRlcmFibGVzKSk7XG4gIH1cblxuICBtZXJnZURlZXBXaXRoKG1lcmdlciwgLi4uaXRlcmFibGVzKSB7XG4gICAgY29uc3QgbWF4U2l6ZSA9IG1heFNpemVGcm9tSXRlcmFibGVzKGl0ZXJhYmxlcyk7XG4gICAgY29uc3QgdHlwZWRJdGVyYWJsZXMgPSBpdGVyYWJsZXMubWFwKGNvbnZlcnRWYWx1ZXNUb1R5cGUuYmluZChudWxsLCB0aGlzWyR0eXBlXSkpO1xuICAgIGlmIChtYXhTaXplID4gdGhpcy5zaXplKSB7XG4gICAgICByZXR1cm4gY2hhbmdlKHRoaXMsIHN0b3JlID0+IHN0b3JlLnNldFNpemUobWF4U2l6ZSkubWVyZ2VEZWVwV2l0aChtZXJnZXIsIC4uLnR5cGVkSXRlcmFibGVzKSk7XG4gICAgfVxuICAgIHJldHVybiBjaGFuZ2UodGhpcywgc3RvcmUgPT4gc3RvcmUubWVyZ2VEZWVwV2l0aChtZXJnZXIsIC4uLnR5cGVkSXRlcmFibGVzKSk7XG4gIH1cblxuICBfX2Vuc3VyZU93bmVyKG93bmVySUQpIHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9fb3duZXJJRCA9PT0gb3duZXJJRCA/IHRoaXMgOlxuICAgICAgICAgICAgICAgICAgICFvd25lcklEID8gdGhpcyA6XG4gICAgICAgICAgICAgICAgICAgY29uc3RydWN0KHRoaXMpXG5cbiAgICByZXN1bHQuX19vd25lcklEID0gb3duZXJJRFxuICAgIHJlc3VsdFskc3RvcmVdID0gdGhpc1skc3RvcmVdID8gdGhpc1skc3RvcmVdLl9fZW5zdXJlT3duZXIob3duZXJJRCkgOlxuICAgICAgICAgICAgICAgICAgICAgSW1tdXRhYmxlTGlzdCgpLl9fZW5zdXJlT3duZXIob3duZXJJRClcbiAgICByZXN1bHQuc2l6ZSA9IHJlc3VsdFskc3RvcmVdLnNpemVcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBfX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpIHtcbiAgICByZXR1cm4gSW5kZXhlZCh0aGlzWyRzdG9yZV0pLm1hcCgoXywga2V5KSA9PiB0aGlzLmdldChrZXkpKS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpXG4gIH1cblxuICBfX2l0ZXJhdGUoZiwgcmV2ZXJzZSkge1xuICAgIHJldHVybiBJbmRleGVkKHRoaXNbJHN0b3JlXSkubWFwKChfLCBrZXkpID0+IHRoaXMuZ2V0KGtleSkpLl9faXRlcmF0ZShmLCByZXZlcnNlKVxuICB9XG59XG5UeXBlSW5mZXJlZExpc3QucHJvdG90eXBlW1R5cGVkLkRFTEVURV0gPSBUeXBlSW5mZXJlZExpc3QucHJvdG90eXBlLnJlbW92ZTtcblxuY29uc3QgQmFzZVR5cGVJbmZlcmVkTGlzdCA9IGZ1bmN0aW9uKCkge31cbkJhc2VUeXBlSW5mZXJlZExpc3QucHJvdG90eXBlID0gVHlwZUluZmVyZWRMaXN0LnByb3RvdHlwZVxuXG5jbGFzcyBUeXBlZExpc3QgZXh0ZW5kcyBCYXNlVHlwZUluZmVyZWRMaXN0IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuICB9XG4gIFtUeXBlZC5pbml0XSgpIHtcbiAgICByZXR1cm4gY29uc3RydWN0KHRoaXMpLmFzTXV0YWJsZSgpXG4gIH1cbiAgW1R5cGVkLnJlc3VsdF0ocmVzdWx0KSB7XG4gICAgcmV0dXJuIHJlc3VsdC5hc0ltbXV0YWJsZSgpXG4gIH1cbiAgbWFwKG1hcHBlciwgY29udGV4dCkge1xuICAgIGlmICh0aGlzLnNpemUgPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFR5cGVJbmZlcmVkTGlzdC5mcm9tKHRoaXMpLm1hcChtYXBwZXIsIGNvbnRleHQpXG4gICAgICBpZiAodGhpc1skc3RvcmVdID09PSByZXN1bHRbJHN0b3JlXSkge1xuICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgfVxuICAgICAgaWYgKHJlc3VsdFskdHlwZV0gPT09IHRoaXNbJHR5cGVdKSB7XG4gICAgICAgIGNvbnN0IGxpc3QgPSBjb25zdHJ1Y3QodGhpcylcbiAgICAgICAgbGlzdFskc3RvcmVdID0gcmVzdWx0WyRzdG9yZV1cbiAgICAgICAgbGlzdC5zaXplID0gcmVzdWx0LnNpemVcbiAgICAgICAgcmV0dXJuIGxpc3RcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZmxhdE1hcChtYXBwZXIsIGNvbnRleHQpIHtcbiAgICBpZiAodGhpcy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBUeXBlSW5mZXJlZExpc3QuZnJvbSh0aGlzKS5mbGF0TWFwKG1hcHBlciwgY29udGV4dClcbiAgICAgIGlmICh0aGlzWyRzdG9yZV0gPT09IHJlc3VsdFskc3RvcmVdKSB7XG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgICB9XG4gICAgICBpZiAocmVzdWx0WyR0eXBlXSA9PT0gdGhpc1skdHlwZV0pIHtcbiAgICAgICAgY29uc3QgbGlzdCA9IGNvbnN0cnVjdCh0aGlzKVxuICAgICAgICBsaXN0WyRzdG9yZV0gPSByZXN1bHRbJHN0b3JlXVxuICAgICAgICBsaXN0LnNpemUgPSByZXN1bHQuc2l6ZVxuICAgICAgICByZXR1cm4gbGlzdFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgfVxuICAgIH1cbiAgfVxuXG59XG5cbmV4cG9ydCBjb25zdCBMaXN0ID0gZnVuY3Rpb24oZGVzY3JpcHRvciwgbGFiZWwpIHtcbiAgaWYgKGRlc2NyaXB0b3IgPT09IHZvaWQoMCkpIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoXCJUeXBlZC5MaXN0IG11c3QgYmUgcGFzc2VkIGEgdHlwZSBkZXNjcmlwdG9yXCIpXG4gIH1cblxuICBpZiAoZGVzY3JpcHRvciA9PT0gQW55KSB7XG4gICAgcmV0dXJuIEltbXV0YWJsZS5MaXN0XG4gIH1cblxuICBjb25zdCB0eXBlID0gdHlwZU9mKGRlc2NyaXB0b3IpXG5cbiAgaWYgKHR5cGUgPT09IEFueSkge1xuICAgIHRocm93IFR5cGVFcnJvcihgVHlwZWQuTGlzdCB3YXMgcGFzc2VkIGFuIGludmFsaWQgdHlwZSBkZXNjcmlwdG9yOiAke2Rlc2NyaXB0b3J9YClcbiAgfVxuXG4gIGNvbnN0IExpc3RUeXBlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBjb25zdCBpc0xpc3RUeXBlID0gdGhpcyBpbnN0YW5jZW9mIExpc3RUeXBlXG4gICAgY29uc3QgVHlwZSA9IGlzTGlzdFR5cGUgPyB0aGlzLmNvbnN0cnVjdG9yIDogTGlzdFR5cGVcblxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFR5cGUpIHtcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IFR5cGUucHJvdG90eXBlWyRyZWFkXSh2YWx1ZSlcblxuICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICAgIHRocm93IHJlc3VsdFxuICAgIH1cblxuICAgIC8vIGBsaXN0Lm1hcChmKWAgd2lsbCBpbiBmYWN0IGNhdXNlIGBsaXN0LmNvbnN0cnVjdG9yKGl0ZW1zKWAgdG8gYmVcbiAgICAvLyBpbnZva2VkIHRoZXJlIGZvciB3ZSBuZWVkIHRvIGNoZWNrIGlmIGB0aGlzWyRzdG9yZV1gIHdhc1xuICAgIC8vIGFzc2lnbmVkIHRvIGtub3cgaWYgaXQncyB0aGF0IG9yIGlmIGl0J3MgYSBgbmV3IExpc3RUeXBlKClgIGNhbGwuXG4gICAgaWYgKGlzTGlzdFR5cGUgJiYgIXRoaXNbJHN0b3JlXSkge1xuICAgICAgdGhpc1skc3RvcmVdID0gcmVzdWx0WyRzdG9yZV1cbiAgICAgIHRoaXMuc2l6ZSA9IHJlc3VsdC5zaXplXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIExpc3RUeXBlLm9mID0gSW1tdXRhYmxlTGlzdC5vZlxuICBMaXN0VHlwZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExpc3RQcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3Rvcjoge3ZhbHVlOiBMaXN0VHlwZX0sXG4gICAgWyR0eXBlXToge3ZhbHVlOiB0eXBlfSxcbiAgICBbJGxhYmVsXToge3ZhbHVlOiBsYWJlbH1cbiAgfSlcblxuICByZXR1cm4gTGlzdFR5cGVcbn1cbkxpc3QuVHlwZSA9IFR5cGVkTGlzdFxuTGlzdC5wcm90b3R5cGUgPSBUeXBlZExpc3QucHJvdG90eXBlXG5jb25zdCBMaXN0UHJvdG90eXBlID0gVHlwZWRMaXN0LnByb3RvdHlwZVxuIl19