(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'immutable'], factory);
  } else if (typeof exports !== 'undefined') {
    factory(exports, require('immutable'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.Immutable);
    global.typed = mod.exports;
  }
})(this, function (exports, _immutable) {
  'use strict';

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

  if (typeof Symbol === 'undefined') {
    var Symbol = function Symbol(hint) {
      return '@@' + hint;
    };
    Symbol['for'] = Symbol;
  }

  function Construct() {}
  var construct = function construct(value) {
    Construct.prototype = value.constructor.prototype;
    return new Construct();
  };

  exports.construct = construct;
  var $type = Symbol['for']("typed/type");
  var $store = Symbol['for']("typed/store");
  var $empty = Symbol['for']("typed/empty");

  var $maybe = Symbol['for']("typed/type/maybe");
  var $default = Symbol['for']("typed/type/default");
  var $label = Symbol['for']("typed/type/label");

  var $init = Symbol['for']("transducer/init");
  var $result = Symbol['for']("transducer/result");
  var $step = Symbol['for']("transducer/step");
  var $read = Symbol['for']("typed/type/read");
  var $parse = Symbol['for']("typed/type/parse");
  var $typeName = Symbol("typed/type/name");
  var $typeSignature = Symbol("typed/type/signature");

  var Typed = function Typed(label, parse, defaultValue) {
    var ValueType = (function (_Type) {
      _inherits(ValueType, _Type);

      function ValueType(defaultValue) {
        _classCallCheck(this, ValueType);

        _get(Object.getPrototypeOf(ValueType.prototype), 'constructor', this).call(this);
        this[$default] = defaultValue;
      }

      return ValueType;
    })(Type);

    var prototype = ValueType.prototype;
    prototype[$default] = defaultValue;
    prototype[$parse] = parse;
    prototype[$label] = label;

    var TypedValue = function TypedValue(defaultValue) {
      return defaultValue === void 0 ? prototype : new ValueType(defaultValue);
    };
    TypedValue.prototype = prototype;

    return TypedValue;
  };

  exports.Typed = Typed;
  Typed.label = $label;
  Typed.defaultValue = $default;
  Typed.read = $read;
  Typed.typeName = $typeName;
  Typed.typeSignature = $typeSignature;

  Typed.type = $type;
  Typed.store = $store;
  Typed.init = $init;
  Typed.result = $result;
  Typed.step = $step;
  Typed.DELETE = "delete";
  Typed.empty = $empty;

  var typeName = function typeName(type) {
    return type[$typeName]();
  };
  var typeSignature = function typeSignature(type) {
    return type[$typeSignature]();
  };

  var Type = (function () {
    function Type() {
      _classCallCheck(this, Type);
    }

    _createClass(Type, [{
      key: Typed.read,
      value: function value() {
        var _value = arguments.length <= 0 || arguments[0] === undefined ? this[$default] : arguments[0];

        return this[$parse](_value);
      }
    }, {
      key: Typed.parse,
      value: function value(_value2) {
        throw TypeError('Type implementation must implement "[read.symbol]" method');
      }
    }, {
      key: Typed.typeName,
      value: function value() {
        var label = this[$label];
        var defaultValue = this[$default];
        return defaultValue === void 0 ? label : label + '(' + JSON.stringify(defaultValue) + ')';
      }
    }]);

    return Type;
  })();

  exports.Type = Type;

  var ObjectPrototype = Object.prototype;

  // Returns `true` if given `x` is a JS array.
  var isArray = Array.isArray || function (x) {
    return ObjectPrototype.toString.call(x) === '[object Array]';
  };

  // Returns `true` if given `x` is a regular expression.
  var isRegExp = function isRegExp(x) {
    return ObjectPrototype.toString.call(x) === '[object RegExp]';
  };

  var typeOf = function typeOf(x) {
    var type = arguments.length <= 1 || arguments[1] === undefined ? typeof x : arguments[1];
    return (function () {
      return x === void 0 ? x : x === null ? x : x[$read] ? x : x.prototype && x.prototype[$read] ? x.prototype : type === "number" ? new Typed.Number(x) : type === "string" ? new Typed.String(x) : type === "boolean" ? new Typed.Boolean(x) : type === "symbol" ? new Typed.Symbol(x) : isArray(x) ? Typed.Array(x) : isRegExp(x) ? new Typed.RegExp(x) : x === String ? Typed.String.prototype : x === Number ? Typed.Number.prototype : x === Boolean ? Typed.Boolean.prototype : x === RegExp ? Typed.RegExp.prototype : x === Array ? Typed.Array.prototype : x === Symbol ? Typed.Symbol.prototype : x === Date ? Typed.Date.prototype :

      // support Immutable objects
      typeof x.toJS === 'function' ? new Typed.ImmutableClass(x.constructor)(x) :

      // support Immutable classes -- all Immutable classes have `isX` static
      // methods, e.g. List.isList, Map.isMap, Set.isSet; using this to
      // approximate that
      typeof x['is' + x.name] === 'function' ? Typed.ImmutableClass(x).prototype : Any;
    })();
  };

  exports.typeOf = typeOf;
  var Any = Typed("Any", function (value) {
    return value;
  })();
  exports.Any = Any;
  Typed.Any = Any;

  Typed.Number = Typed("Number", function (value) {
    return typeof value === "number" ? value : TypeError('"' + value + '" is not a number');
  });

  Typed.String = Typed("String", function (value) {
    return typeof value === "string" ? value : TypeError('"' + value + '" is not a string');
  });

  Typed.Symbol = Typed("Symbol", function (value) {
    return typeof value === "symbol" ? value : TypeError('"' + value + '" is not a symbol');
  });

  Typed.Array = Typed("Array", function (value) {
    return isArray(value) ? value : TypeError('"' + value + '" is not an array');
  });

  Typed.RegExp = Typed("RegExp", function (value) {
    return value instanceof RegExp ? value : TypeError('"' + value + '" is not a regexp');
  });

  Typed.Boolean = Typed("Boolean", function (value) {
    return value === true ? true : value === false ? false : TypeError('"' + value + '" is not a boolean');
  });

  Typed.Date = Typed("Date", function (value) {
    var d = new Date(value);
    if (isNaN(d.valueOf())) {
      return new TypeError('"' + value + '" is not a valid date.');
    }
    return d;
  });

  Typed.ImmutableClass = function (cls) {
    return Typed('Immutable.' + cls.name, function (value) {
      if (value instanceof cls) {
        return value;
      } else if (typeof value === 'undefined' || value === null) {
        return new TypeError('Expected ' + cls.name + '; got nothing.');
      } else {
        try {
          return new cls(value);
        } catch (ex) {
          return ex;
        }
      }
    });
  };

  var MaybeType = (function (_Type2) {
    _inherits(MaybeType, _Type2);

    function MaybeType(type) {
      _classCallCheck(this, MaybeType);

      _get(Object.getPrototypeOf(MaybeType.prototype), 'constructor', this).call(this);
      this[$type] = type;
    }

    _createClass(MaybeType, [{
      key: Typed.typeName,
      value: function value() {
        return 'Maybe(' + this[$type][$typeName]() + ')';
      }
    }, {
      key: Typed.read,
      value: function value(_value3) {
        var result = _value3 == null ? null : this[$type][$read](_value3);

        return !(result instanceof TypeError) ? result : TypeError('"' + _value3 + '" is not nully nor it is of ' + this[$type][$typeName]() + ' type');
      }
    }]);

    return MaybeType;
  })(Type);

  var Maybe = function Maybe(Type) {
    var type = typeOf(Type);
    if (type === Any) {
      throw TypeError(Type + ' is not a valid type');
    }

    return type[$maybe] || (type[$maybe] = new MaybeType(type));
  };
  exports.Maybe = Maybe;
  Maybe.Type = MaybeType;

  var UnionType = (function (_Type3) {
    _inherits(UnionType, _Type3);

    function UnionType(variants) {
      _classCallCheck(this, UnionType);

      _get(Object.getPrototypeOf(UnionType.prototype), 'constructor', this).call(this);
      this[$type] = variants;
    }

    // Returns `xs` excluding any values that are included in `ys`.

    _createClass(UnionType, [{
      key: Typed.typeName,
      value: function value() {
        return 'Union(' + this[$type].map(typeName).join(', ') + ')';
      }
    }, {
      key: Typed.read,
      value: function value(_value4) {
        var variants = this[$type];
        var count = variants.length;
        var index = 0;
        while (index < count) {
          var variant = variants[index];
          if (_value4 instanceof variant.constructor) {
            return _value4;
          }
          index = index + 1;
        }

        index = 0;
        while (index < count) {
          var result = undefined;
          try {
            result = variants[index][$read](_value4);
            if (!(result instanceof TypeError)) {
              return result;
            }
          } catch (ex) {
            if (!(ex instanceof TypeError)) {
              throw ex;
            }
          }
          index = index + 1;
        }

        return TypeError('"' + _value4 + '" does not satisfy ' + this[$typeName]() + ' type');
      }
    }]);

    return UnionType;
  })(Type);

  var subtract = function subtract(xs, ys) {
    return xs.filter(function (x) {
      return ys.indexOf(x) < 0;
    });
  };

  // Returns array including all values from `xs` and all values from
  // `ys` that aren't already included in `xs`. It will also attempt
  // to return either `xs` or `ys` if one of them is a superset of other.
  // return `xs` or `ys` if
  var union = function union(xs, ys) {
    // xs can be superset only if it contains more items then
    // ys. If that's a case find items in ys that arent included
    // in xs. If such items do not exist return back `xs` otherwise
    // return concatination of xs with those items.
    // those items
    if (xs.length > ys.length) {
      var diff = subtract(ys, xs);
      return diff.length === 0 ? xs : xs.concat(diff);
    }
    // if number of items in xs is not greater than number of items in ys
    // then either xs is either subset or equal of `ys`. There for we find
    // ys that are not included in `xs` if such items aren't found ys is
    // either superset or equal so just return ys otherwise return concatination
    // of those items with `ys`.
    else {
        var diff = subtract(xs, ys);
        return diff.length === 0 ? ys : diff.concat(ys);
      }
  };

  var Union = function Union() {
    for (var _len = arguments.length, Types = Array(_len), _key = 0; _key < _len; _key++) {
      Types[_key] = arguments[_key];
    }

    var count = Types.length;

    if (count === 0) {
      throw TypeError('Union must be of at at least one type');
    }

    var variants = null;
    var type = null;
    var index = 0;
    while (index < count) {
      var variant = typeOf(Types[index]);
      // If there is `Any` present than union is also `Any`.
      if (variant === Any) {
        return Any;
      }
      // If this is the first type we met than we assume it's the
      // one that satisfies all types.
      if (!variants) {
        type = variant;
        variants = type instanceof UnionType ? type[$type] : [variant];
      } else if (variants.indexOf(variant) < 0) {
        // If current reader is of union type
        if (variant instanceof UnionType) {
          var variantUnion = union(variants, variant[$type]);

          // If `reader.readers` matches union of readers, then
          // current reader is a superset so we use it as a type
          // that satisfies all types.
          if (variantUnion === variant[$type]) {
            type = variant;
            variants = variantUnion;
          }
          // If current readers is not the union than it does not
          // satisfy currenty reader. There for we update readers
          // and unset a type.
          else if (variantUnion !== variants) {
              type = null;
              variants = variantUnion;
            }
        } else {
          type = null;
          variants.push(variant);
        }
      }

      index = index + 1;
    }

    return type ? type : new UnionType(variants);
  };
  exports.Union = Union;
  Union.Type = UnionType;

  Typed.Number.Range = function (from, to, defaultValue) {
    if (to === undefined) to = +Infinity;
    return Typed('Typed.Number.Range(' + from + '..' + to + ')', function (value) {
      if (typeof value !== 'number') {
        return TypeError('"' + value + '" is not a number');
      }

      if (!(value >= from && value <= to)) {
        return TypeError('"' + value + '" isn\'t in the range of ' + from + '..' + to);
      }

      return value;
    }, defaultValue);
  };
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90eXBlZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBSSxPQUFPLE1BQU0sQUFBQyxLQUFLLFdBQVcsRUFBRTtBQUNsQyxRQUFJLE1BQU0sR0FBRyxTQUFULE1BQU0sQ0FBRyxJQUFJO29CQUFTLElBQUk7S0FBRSxDQUFBO0FBQ2hDLFVBQU0sT0FBSSxHQUFHLE1BQU0sQ0FBQTtHQUNwQjs7QUFFRCxXQUFTLFNBQVMsR0FBRyxFQUFFO0FBQ2hCLE1BQU0sU0FBUyxHQUFHLFNBQVosU0FBUyxDQUFHLEtBQUssRUFBSTtBQUNoQyxhQUFTLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFBO0FBQ2pELFdBQU8sSUFBSSxTQUFTLEVBQUUsQ0FBQTtHQUN2QixDQUFBOzs7QUFFRCxNQUFNLEtBQUssR0FBRyxNQUFNLE9BQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUN0QyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUN4QyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTs7QUFFeEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtBQUM3QyxNQUFNLFFBQVEsR0FBRyxNQUFNLE9BQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0FBQ2pELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBSSxDQUFDLGtCQUFrQixDQUFDLENBQUE7O0FBRTdDLE1BQU0sS0FBSyxHQUFHLE1BQU0sT0FBSSxDQUFDLGlCQUFpQixDQUFDLENBQUE7QUFDM0MsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtBQUMvQyxNQUFNLEtBQUssR0FBRyxNQUFNLE9BQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0FBQzNDLE1BQU0sS0FBSyxHQUFHLE1BQU0sT0FBSSxDQUFDLGlCQUFpQixDQUFDLENBQUE7QUFDM0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtBQUM3QyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtBQUMzQyxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQTs7QUFFOUMsTUFBTSxLQUFLLEdBQUcsU0FBUixLQUFLLENBQVksS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUU7UUFDbEQsU0FBUztnQkFBVCxTQUFTOztBQUNGLGVBRFAsU0FBUyxDQUNELFlBQVksRUFBRTs4QkFEdEIsU0FBUzs7QUFFWCxtQ0FGRSxTQUFTLDZDQUVKO0FBQ1AsWUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFlBQVksQ0FBQTtPQUM5Qjs7YUFKRyxTQUFTO09BQVMsSUFBSTs7QUFPNUIsUUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQTtBQUNyQyxhQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsWUFBWSxDQUFBO0FBQ2xDLGFBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUE7QUFDekIsYUFBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQTs7QUFFekIsUUFBTSxVQUFVLEdBQUcsU0FBYixVQUFVLENBQVksWUFBWSxFQUFFO0FBQ3hDLGFBQU8sWUFBWSxLQUFLLEtBQUssQ0FBQyxBQUFDLEdBQUcsU0FBUyxHQUMzQyxJQUFJLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQTtLQUM1QixDQUFBO0FBQ0QsY0FBVSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUE7O0FBRWhDLFdBQU8sVUFBVSxDQUFBO0dBQ2xCLENBQUE7OztBQUVELE9BQUssQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFBO0FBQ3BCLE9BQUssQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFBO0FBQzdCLE9BQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFBO0FBQ2xCLE9BQUssQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFBO0FBQzFCLE9BQUssQ0FBQyxhQUFhLEdBQUcsY0FBYyxDQUFBOztBQUVwQyxPQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQTtBQUNsQixPQUFLLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQTtBQUNwQixPQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQTtBQUNsQixPQUFLLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQTtBQUN0QixPQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQTtBQUNsQixPQUFLLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQTtBQUN2QixPQUFLLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQTs7QUFFcEIsTUFBTSxRQUFRLEdBQUcsU0FBWCxRQUFRLENBQUcsSUFBSTtXQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtHQUFBLENBQUE7QUFDMUMsTUFBTSxhQUFhLEdBQUcsU0FBaEIsYUFBYSxDQUFHLElBQUk7V0FBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUU7R0FBQSxDQUFBOztNQUV2QyxJQUFJO0FBQ0osYUFEQSxJQUFJLEdBQ0Q7NEJBREgsSUFBSTtLQUNDOztpQkFETCxJQUFJO1dBRWQsS0FBSyxDQUFDLElBQUk7YUFBQyxpQkFBdUI7WUFBdEIsTUFBSyx5REFBQyxJQUFJLENBQUMsUUFBUSxDQUFDOztBQUMvQixlQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFLLENBQUMsQ0FBQTtPQUMzQjs7V0FDQSxLQUFLLENBQUMsS0FBSzthQUFDLGVBQUMsT0FBSyxFQUFFO0FBQ25CLGNBQU0sU0FBUyw2REFBNkQsQ0FBQTtPQUM3RTs7V0FDQSxLQUFLLENBQUMsUUFBUTthQUFDLGlCQUFHO0FBQ2pCLFlBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUMxQixZQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDbkMsZUFBTyxZQUFZLEtBQUssS0FBSyxDQUFDLEFBQUMsR0FBRyxLQUFLLEdBQU0sS0FBSyxTQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLE1BQUcsQ0FBQTtPQUN0Rjs7O1dBWlUsSUFBSTs7Ozs7QUFlakIsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQTs7O0FBR3hDLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLElBQzFCLFVBQUEsQ0FBQztXQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLGdCQUFnQjtHQUFBLEFBQUMsQ0FBQTs7O0FBRzlELE1BQU0sUUFBUSxHQUFHLFNBQVgsUUFBUSxDQUFHLENBQUM7V0FDaEIsZUFBZSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssaUJBQWlCO0dBQUEsQ0FBQTs7QUFHakQsTUFBTSxNQUFNLEdBQUcsU0FBVCxNQUFNLENBQUksQ0FBQztRQUFFLElBQUkseURBQUMsT0FBTyxDQUFDLEFBQUM7O2FBQ3RDLENBQUMsS0FBSyxLQUFLLENBQUMsQUFBQyxHQUFHLENBQUMsR0FDakIsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLEdBQ2QsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FDWixBQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBSSxDQUFDLENBQUMsU0FBUyxHQUNqRCxJQUFJLEtBQUssUUFBUSxHQUFHLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FDdkMsSUFBSSxLQUFLLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQ3ZDLElBQUksS0FBSyxTQUFTLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUN6QyxJQUFJLEtBQUssUUFBUSxHQUFHLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FDdkMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQzNCLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQ2pDLENBQUMsS0FBSyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQ3JDLENBQUMsS0FBSyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQ3JDLENBQUMsS0FBSyxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQ3ZDLENBQUMsS0FBSyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQ3JDLENBQUMsS0FBSyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQ25DLENBQUMsS0FBSyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQ3JDLENBQUMsS0FBSyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTOzs7QUFHakMsYUFBTyxDQUFDLENBQUMsSUFBSSxLQUFLLFVBQVUsR0FBRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Ozs7QUFLekUsYUFBTyxDQUFDLFFBQU0sQ0FBQyxDQUFDLElBQUksQ0FBRyxLQUFLLFVBQVUsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FFMUUsR0FBRzs7R0FBQSxDQUFDOzs7QUFFQyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLFVBQUEsS0FBSztXQUFJLEtBQUs7R0FBQSxDQUFDLEVBQUUsQ0FBQTs7QUFDakQsT0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUE7O0FBRWYsT0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLFVBQUEsS0FBSztXQUNsQyxPQUFPLEtBQUssQUFBQyxLQUFLLFFBQVEsR0FBRyxLQUFLLEdBQ2xDLFNBQVMsT0FBSyxLQUFLLHVCQUFvQjtHQUFBLENBQUMsQ0FBQTs7QUFFMUMsT0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLFVBQUEsS0FBSztXQUNsQyxPQUFPLEtBQUssQUFBQyxLQUFLLFFBQVEsR0FBRyxLQUFLLEdBQ2xDLFNBQVMsT0FBSyxLQUFLLHVCQUFvQjtHQUFBLENBQUMsQ0FBQTs7QUFFMUMsT0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLFVBQUEsS0FBSztXQUNsQyxPQUFPLEtBQUssQUFBQyxLQUFLLFFBQVEsR0FBRyxLQUFLLEdBQ2xDLFNBQVMsT0FBSyxLQUFLLHVCQUFvQjtHQUFBLENBQUMsQ0FBQTs7QUFFMUMsT0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLFVBQUEsS0FBSztXQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxHQUN0QixTQUFTLE9BQUssS0FBSyx1QkFBb0I7R0FBQSxDQUFDLENBQUE7O0FBRTFDLE9BQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxVQUFBLEtBQUs7V0FDbEMsS0FBSyxZQUFZLE1BQU0sR0FBRyxLQUFLLEdBQy9CLFNBQVMsT0FBSyxLQUFLLHVCQUFvQjtHQUFBLENBQUMsQ0FBQTs7QUFFMUMsT0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsU0FBUyxFQUFFLFVBQUEsS0FBSztXQUNwQyxLQUFLLEtBQUssSUFBSSxHQUFHLElBQUksR0FDckIsS0FBSyxLQUFLLEtBQUssR0FBRyxLQUFLLEdBQ3ZCLFNBQVMsT0FBSyxLQUFLLHdCQUFxQjtHQUFBLENBQUMsQ0FBQTs7QUFFM0MsT0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLFVBQUEsS0FBSyxFQUFJO0FBQ2xDLFFBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3ZCLFFBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFO0FBQ3RCLGFBQU8sSUFBSSxTQUFTLE9BQUssS0FBSyw0QkFBeUIsQ0FBQTtLQUN4RDtBQUNELFdBQU8sQ0FBQyxDQUFBO0dBQ1QsQ0FBQyxDQUFBOztBQUVGLE9BQUssQ0FBQyxjQUFjLEdBQUcsVUFBQSxHQUFHO1dBQUksS0FBSyxnQkFBYyxHQUFHLENBQUMsSUFBSSxFQUFJLFVBQUEsS0FBSyxFQUFJO0FBQ3BFLFVBQUksS0FBSyxZQUFZLEdBQUcsRUFBRTtBQUN4QixlQUFPLEtBQUssQ0FBQTtPQUNiLE1BQ0ksSUFBSSxPQUFPLEtBQUssS0FBSyxXQUFXLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtBQUN2RCxlQUFPLElBQUksU0FBUyxlQUFhLEdBQUcsQ0FBQyxJQUFJLG9CQUFpQixDQUFBO09BQzNELE1BQ0k7QUFDSCxZQUFJO0FBQUUsaUJBQU8sSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7U0FBRSxDQUM5QixPQUFPLEVBQUUsRUFBRTtBQUFFLGlCQUFPLEVBQUUsQ0FBQztTQUFFO09BQzFCO0tBQ0YsQ0FBQztHQUFBLENBQUE7O01BR0ksU0FBUztjQUFULFNBQVM7O0FBQ0YsYUFEUCxTQUFTLENBQ0QsSUFBSSxFQUFFOzRCQURkLFNBQVM7O0FBRVgsaUNBRkUsU0FBUyw2Q0FFSjtBQUNQLFVBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUE7S0FDbkI7O2lCQUpHLFNBQVM7V0FLWixLQUFLLENBQUMsUUFBUTthQUFDLGlCQUFHO0FBQ2pCLDBCQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBRztPQUM1Qzs7V0FDQSxLQUFLLENBQUMsSUFBSTthQUFDLGVBQUMsT0FBSyxFQUFFO0FBQ2xCLFlBQU0sTUFBTSxHQUFHLE9BQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFLLENBQUMsQ0FBQTs7QUFFL0QsZUFBTyxFQUFFLE1BQU0sWUFBWSxTQUFTLENBQUEsQUFBQyxHQUFHLE1BQU0sR0FDdkMsU0FBUyxPQUFLLE9BQUssb0NBQStCLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxXQUFRLENBQUE7T0FDMUY7OztXQWJHLFNBQVM7S0FBUyxJQUFJOztBQWdCckIsTUFBTSxLQUFLLEdBQUcsU0FBUixLQUFLLENBQUcsSUFBSSxFQUFJO0FBQzNCLFFBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUN6QixRQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7QUFDaEIsWUFBTSxTQUFTLENBQUksSUFBSSwwQkFBdUIsQ0FBQTtLQUMvQzs7QUFFRCxXQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUEsQUFBQyxDQUFBO0dBQzVELENBQUE7O0FBQ0QsT0FBSyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUE7O01BR2hCLFNBQVM7Y0FBVCxTQUFTOztBQUNGLGFBRFAsU0FBUyxDQUNELFFBQVEsRUFBRTs0QkFEbEIsU0FBUzs7QUFFWCxpQ0FGRSxTQUFTLDZDQUVKO0FBQ1AsVUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLFFBQVEsQ0FBQTtLQUN2Qjs7OztpQkFKRyxTQUFTO1dBS1osS0FBSyxDQUFDLFFBQVE7YUFBQyxpQkFBRztBQUNqQiwwQkFBZ0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQUc7T0FDeEQ7O1dBQ0EsS0FBSyxDQUFDLElBQUk7YUFBQyxlQUFDLE9BQUssRUFBRTtBQUNsQixZQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDNUIsWUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQTtBQUM3QixZQUFJLEtBQUssR0FBRyxDQUFDLENBQUE7QUFDYixlQUFPLEtBQUssR0FBRyxLQUFLLEVBQUU7QUFDcEIsY0FBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQy9CLGNBQUksT0FBSyxZQUFZLE9BQU8sQ0FBQyxXQUFXLEVBQUU7QUFDeEMsbUJBQU8sT0FBSyxDQUFBO1dBQ2I7QUFDRCxlQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQTtTQUNsQjs7QUFFRCxhQUFLLEdBQUcsQ0FBQyxDQUFBO0FBQ1QsZUFBTyxLQUFLLEdBQUcsS0FBSyxFQUFFO0FBQ3BCLGNBQUksTUFBTSxZQUFBLENBQUE7QUFDVixjQUFJO0FBQ0Ysa0JBQU0sR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBSyxDQUFDLENBQUE7QUFDdEMsZ0JBQUksRUFBRSxNQUFNLFlBQVksU0FBUyxDQUFBLEFBQUMsRUFBRTtBQUNsQyxxQkFBTyxNQUFNLENBQUE7YUFDZDtXQUNGLENBQUMsT0FBTyxFQUFFLEVBQUU7QUFDWCxnQkFBSSxFQUFFLEVBQUUsWUFBWSxTQUFTLENBQUEsQUFBQyxFQUFFO0FBQzlCLG9CQUFNLEVBQUUsQ0FBQTthQUNUO1dBQ0Y7QUFDRCxlQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQTtTQUNsQjs7QUFFRCxlQUFPLFNBQVMsT0FBSyxPQUFLLDJCQUFzQixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsV0FBUSxDQUFBO09BQzFFOzs7V0FyQ0csU0FBUztLQUFTLElBQUk7O0FBeUM1QixNQUFNLFFBQVEsR0FBRyxTQUFYLFFBQVEsQ0FBSSxFQUFFLEVBQUUsRUFBRTtXQUN0QixFQUFFLENBQUMsTUFBTSxDQUFDLFVBQUEsQ0FBQzthQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztLQUFBLENBQUM7R0FBQSxDQUFBOzs7Ozs7QUFNbkMsTUFBTSxLQUFLLEdBQUcsU0FBUixLQUFLLENBQUksRUFBRSxFQUFFLEVBQUUsRUFBSzs7Ozs7O0FBTXhCLFFBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFO0FBQ3pCLFVBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDN0IsYUFBTyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUNoRDs7Ozs7O1NBTUk7QUFDSCxZQUFNLElBQUksR0FBRyxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0FBQzdCLGVBQU8sSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7T0FDaEQ7R0FDRixDQUFBOztBQUVNLE1BQU0sS0FBSyxHQUFHLFNBQVIsS0FBSyxHQUFpQjtzQ0FBVixLQUFLO0FBQUwsV0FBSzs7O0FBQzVCLFFBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7O0FBRTFCLFFBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtBQUNmLFlBQU0sU0FBUyx5Q0FBeUMsQ0FBQTtLQUN6RDs7QUFFRCxRQUFJLFFBQVEsR0FBRyxJQUFJLENBQUE7QUFDbkIsUUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFBO0FBQ2YsUUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsV0FBTyxLQUFLLEdBQUcsS0FBSyxFQUFFO0FBQ3BCLFVBQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTs7QUFFcEMsVUFBSSxPQUFPLEtBQUssR0FBRyxFQUFFO0FBQ25CLGVBQU8sR0FBRyxDQUFBO09BQ1g7OztBQUdELFVBQUksQ0FBQyxRQUFRLEVBQUU7QUFDYixZQUFJLEdBQUcsT0FBTyxDQUFBO0FBQ2QsZ0JBQVEsR0FBRyxJQUFJLFlBQVksU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO09BQy9ELE1BQU0sSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTs7QUFFeEMsWUFBSSxPQUFPLFlBQVksU0FBUyxFQUFFO0FBQ2hDLGNBQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7Ozs7O0FBS3BELGNBQUksWUFBWSxLQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNuQyxnQkFBSSxHQUFHLE9BQU8sQ0FBQTtBQUNkLG9CQUFRLEdBQUcsWUFBWSxDQUFBO1dBQ3hCOzs7O2VBSUksSUFBSSxZQUFZLEtBQUssUUFBUSxFQUFFO0FBQ2xDLGtCQUFJLEdBQUcsSUFBSSxDQUFBO0FBQ1gsc0JBQVEsR0FBRyxZQUFZLENBQUE7YUFDeEI7U0FDRixNQUFNO0FBQ0wsY0FBSSxHQUFHLElBQUksQ0FBQTtBQUNYLGtCQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1NBQ3ZCO09BQ0Y7O0FBRUQsV0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUE7S0FDbEI7O0FBRUQsV0FBTyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0dBQzdDLENBQUE7O0FBQ0QsT0FBSyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUE7O0FBR3RCLE9BQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLFVBQUMsSUFBSSxFQUFFLEVBQUUsRUFBWSxZQUFZO1FBQTFCLEVBQUUsZ0JBQUYsRUFBRSxHQUFDLENBQUMsUUFBUTtXQUN0QyxLQUFLLHlCQUF1QixJQUFJLFVBQUssRUFBRSxRQUFLLFVBQUEsS0FBSyxFQUFJO0FBQ25ELFVBQUksT0FBTyxLQUFLLEFBQUMsS0FBSyxRQUFRLEVBQUU7QUFDOUIsZUFBTyxTQUFTLE9BQUssS0FBSyx1QkFBb0IsQ0FBQTtPQUMvQzs7QUFFRCxVQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLElBQUksRUFBRSxDQUFBLEFBQUMsRUFBRTtBQUNuQyxlQUFPLFNBQVMsT0FBSyxLQUFLLGlDQUEyQixJQUFJLFVBQUssRUFBRSxDQUFHLENBQUE7T0FDcEU7O0FBRUQsYUFBTyxLQUFLLENBQUE7S0FDYixFQUFFLFlBQVksQ0FBQztHQUFBLENBQUEiLCJmaWxlIjoidHlwZWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBJbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJ1xuXG5pZiAodHlwZW9mKFN5bWJvbCkgPT09ICd1bmRlZmluZWQnKSB7XG4gIHZhciBTeW1ib2wgPSBoaW50ID0+IGBAQCR7aGludH1gXG4gIFN5bWJvbC5mb3IgPSBTeW1ib2xcbn1cblxuZnVuY3Rpb24gQ29uc3RydWN0KCkge31cbmV4cG9ydCBjb25zdCBjb25zdHJ1Y3QgPSB2YWx1ZSA9PiB7XG4gIENvbnN0cnVjdC5wcm90b3R5cGUgPSB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ldyBDb25zdHJ1Y3QoKVxufVxuXG5jb25zdCAkdHlwZSA9IFN5bWJvbC5mb3IoXCJ0eXBlZC90eXBlXCIpXG5jb25zdCAkc3RvcmUgPSBTeW1ib2wuZm9yKFwidHlwZWQvc3RvcmVcIilcbmNvbnN0ICRlbXB0eSA9IFN5bWJvbC5mb3IoXCJ0eXBlZC9lbXB0eVwiKVxuXG5jb25zdCAkbWF5YmUgPSBTeW1ib2wuZm9yKFwidHlwZWQvdHlwZS9tYXliZVwiKVxuY29uc3QgJGRlZmF1bHQgPSBTeW1ib2wuZm9yKFwidHlwZWQvdHlwZS9kZWZhdWx0XCIpXG5jb25zdCAkbGFiZWwgPSBTeW1ib2wuZm9yKFwidHlwZWQvdHlwZS9sYWJlbFwiKVxuXG5jb25zdCAkaW5pdCA9IFN5bWJvbC5mb3IoXCJ0cmFuc2R1Y2VyL2luaXRcIilcbmNvbnN0ICRyZXN1bHQgPSBTeW1ib2wuZm9yKFwidHJhbnNkdWNlci9yZXN1bHRcIilcbmNvbnN0ICRzdGVwID0gU3ltYm9sLmZvcihcInRyYW5zZHVjZXIvc3RlcFwiKVxuY29uc3QgJHJlYWQgPSBTeW1ib2wuZm9yKFwidHlwZWQvdHlwZS9yZWFkXCIpXG5jb25zdCAkcGFyc2UgPSBTeW1ib2wuZm9yKFwidHlwZWQvdHlwZS9wYXJzZVwiKVxuY29uc3QgJHR5cGVOYW1lID0gU3ltYm9sKFwidHlwZWQvdHlwZS9uYW1lXCIpXG5jb25zdCAkdHlwZVNpZ25hdHVyZSA9IFN5bWJvbChcInR5cGVkL3R5cGUvc2lnbmF0dXJlXCIpXG5cbmV4cG9ydCBjb25zdCBUeXBlZCA9IGZ1bmN0aW9uKGxhYmVsLCBwYXJzZSwgZGVmYXVsdFZhbHVlKSB7XG4gIGNsYXNzIFZhbHVlVHlwZSBleHRlbmRzIFR5cGUge1xuICAgIGNvbnN0cnVjdG9yKGRlZmF1bHRWYWx1ZSkge1xuICAgICAgc3VwZXIoKVxuICAgICAgdGhpc1skZGVmYXVsdF0gPSBkZWZhdWx0VmFsdWVcbiAgICB9XG4gIH1cblxuICBjb25zdCBwcm90b3R5cGUgPSBWYWx1ZVR5cGUucHJvdG90eXBlXG4gIHByb3RvdHlwZVskZGVmYXVsdF0gPSBkZWZhdWx0VmFsdWVcbiAgcHJvdG90eXBlWyRwYXJzZV0gPSBwYXJzZVxuICBwcm90b3R5cGVbJGxhYmVsXSA9IGxhYmVsXG5cbiAgY29uc3QgVHlwZWRWYWx1ZSA9IGZ1bmN0aW9uKGRlZmF1bHRWYWx1ZSkge1xuICAgIHJldHVybiBkZWZhdWx0VmFsdWUgPT09IHZvaWQoMCkgPyBwcm90b3R5cGUgOlxuICAgIG5ldyBWYWx1ZVR5cGUoZGVmYXVsdFZhbHVlKVxuICB9XG4gIFR5cGVkVmFsdWUucHJvdG90eXBlID0gcHJvdG90eXBlXG5cbiAgcmV0dXJuIFR5cGVkVmFsdWVcbn1cblxuVHlwZWQubGFiZWwgPSAkbGFiZWxcblR5cGVkLmRlZmF1bHRWYWx1ZSA9ICRkZWZhdWx0XG5UeXBlZC5yZWFkID0gJHJlYWRcblR5cGVkLnR5cGVOYW1lID0gJHR5cGVOYW1lXG5UeXBlZC50eXBlU2lnbmF0dXJlID0gJHR5cGVTaWduYXR1cmVcblxuVHlwZWQudHlwZSA9ICR0eXBlXG5UeXBlZC5zdG9yZSA9ICRzdG9yZVxuVHlwZWQuaW5pdCA9ICRpbml0XG5UeXBlZC5yZXN1bHQgPSAkcmVzdWx0XG5UeXBlZC5zdGVwID0gJHN0ZXBcblR5cGVkLkRFTEVURSA9IFwiZGVsZXRlXCJcblR5cGVkLmVtcHR5ID0gJGVtcHR5XG5cbmNvbnN0IHR5cGVOYW1lID0gdHlwZSA9PiB0eXBlWyR0eXBlTmFtZV0oKVxuY29uc3QgdHlwZVNpZ25hdHVyZSA9IHR5cGUgPT4gdHlwZVskdHlwZVNpZ25hdHVyZV0oKVxuXG5leHBvcnQgY2xhc3MgVHlwZSB7XG4gIGNvbnN0cnVjdG9yKCkge31cbiAgW1R5cGVkLnJlYWRdKHZhbHVlPXRoaXNbJGRlZmF1bHRdKSB7XG4gICAgcmV0dXJuIHRoaXNbJHBhcnNlXSh2YWx1ZSlcbiAgfVxuICBbVHlwZWQucGFyc2VdKHZhbHVlKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKGBUeXBlIGltcGxlbWVudGF0aW9uIG11c3QgaW1wbGVtZW50IFwiW3JlYWQuc3ltYm9sXVwiIG1ldGhvZGApXG4gIH1cbiAgW1R5cGVkLnR5cGVOYW1lXSgpIHtcbiAgICBjb25zdCBsYWJlbCA9IHRoaXNbJGxhYmVsXVxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IHRoaXNbJGRlZmF1bHRdXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZSA9PT0gdm9pZCgwKSA/IGxhYmVsIDogYCR7bGFiZWx9KCR7SlNPTi5zdHJpbmdpZnkoZGVmYXVsdFZhbHVlKX0pYFxuICB9XG59XG5cbmNvbnN0IE9iamVjdFByb3RvdHlwZSA9IE9iamVjdC5wcm90b3R5cGVcblxuLy8gUmV0dXJucyBgdHJ1ZWAgaWYgZ2l2ZW4gYHhgIGlzIGEgSlMgYXJyYXkuXG5jb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fFxuICAoeCA9PiBPYmplY3RQcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJylcblxuLy8gUmV0dXJucyBgdHJ1ZWAgaWYgZ2l2ZW4gYHhgIGlzIGEgcmVndWxhciBleHByZXNzaW9uLlxuY29uc3QgaXNSZWdFeHAgPSB4ID0+XG4gIE9iamVjdFByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBSZWdFeHBdJ1xuXG5cbmV4cG9ydCBjb25zdCB0eXBlT2YgPSAoeCwgdHlwZT10eXBlb2YoeCkpID0+XG4gIHggPT09IHZvaWQoMCkgPyB4IDpcbiAgeCA9PT0gbnVsbCA/IHggOlxuICB4WyRyZWFkXSA/IHggOlxuICAoeC5wcm90b3R5cGUgJiYgeC5wcm90b3R5cGVbJHJlYWRdKSA/IHgucHJvdG90eXBlIDpcbiAgdHlwZSA9PT0gXCJudW1iZXJcIiA/IG5ldyBUeXBlZC5OdW1iZXIoeCkgOlxuICB0eXBlID09PSBcInN0cmluZ1wiID8gbmV3IFR5cGVkLlN0cmluZyh4KSA6XG4gIHR5cGUgPT09IFwiYm9vbGVhblwiID8gbmV3IFR5cGVkLkJvb2xlYW4oeCkgOlxuICB0eXBlID09PSBcInN5bWJvbFwiID8gbmV3IFR5cGVkLlN5bWJvbCh4KSA6XG4gIGlzQXJyYXkoeCkgPyBUeXBlZC5BcnJheSh4KSA6XG4gIGlzUmVnRXhwKHgpID8gbmV3IFR5cGVkLlJlZ0V4cCh4KSA6XG4gIHggPT09IFN0cmluZyA/IFR5cGVkLlN0cmluZy5wcm90b3R5cGUgOlxuICB4ID09PSBOdW1iZXIgPyBUeXBlZC5OdW1iZXIucHJvdG90eXBlIDpcbiAgeCA9PT0gQm9vbGVhbiA/IFR5cGVkLkJvb2xlYW4ucHJvdG90eXBlIDpcbiAgeCA9PT0gUmVnRXhwID8gVHlwZWQuUmVnRXhwLnByb3RvdHlwZSA6XG4gIHggPT09IEFycmF5ID8gVHlwZWQuQXJyYXkucHJvdG90eXBlIDpcbiAgeCA9PT0gU3ltYm9sID8gVHlwZWQuU3ltYm9sLnByb3RvdHlwZSA6XG4gIHggPT09IERhdGUgPyBUeXBlZC5EYXRlLnByb3RvdHlwZSA6XG5cbiAgLy8gc3VwcG9ydCBJbW11dGFibGUgb2JqZWN0c1xuICB0eXBlb2YgeC50b0pTID09PSAnZnVuY3Rpb24nID8gbmV3IFR5cGVkLkltbXV0YWJsZUNsYXNzKHguY29uc3RydWN0b3IpKHgpIDpcblxuICAvLyBzdXBwb3J0IEltbXV0YWJsZSBjbGFzc2VzIC0tIGFsbCBJbW11dGFibGUgY2xhc3NlcyBoYXZlIGBpc1hgIHN0YXRpY1xuICAvLyBtZXRob2RzLCBlLmcuIExpc3QuaXNMaXN0LCBNYXAuaXNNYXAsIFNldC5pc1NldDsgdXNpbmcgdGhpcyB0b1xuICAvLyBhcHByb3hpbWF0ZSB0aGF0XG4gIHR5cGVvZiB4W2BpcyR7eC5uYW1lfWBdID09PSAnZnVuY3Rpb24nID8gVHlwZWQuSW1tdXRhYmxlQ2xhc3MoeCkucHJvdG90eXBlIDpcblxuICBBbnk7XG5cbmV4cG9ydCBjb25zdCBBbnkgPSBUeXBlZChcIkFueVwiLCB2YWx1ZSA9PiB2YWx1ZSkoKVxuVHlwZWQuQW55ID0gQW55XG5cblR5cGVkLk51bWJlciA9IFR5cGVkKFwiTnVtYmVyXCIsIHZhbHVlID0+XG4gIHR5cGVvZih2YWx1ZSkgPT09IFwibnVtYmVyXCIgPyB2YWx1ZSA6XG4gIFR5cGVFcnJvcihgXCIke3ZhbHVlfVwiIGlzIG5vdCBhIG51bWJlcmApKVxuXG5UeXBlZC5TdHJpbmcgPSBUeXBlZChcIlN0cmluZ1wiLCB2YWx1ZSA9PlxuICB0eXBlb2YodmFsdWUpID09PSBcInN0cmluZ1wiID8gdmFsdWUgOlxuICBUeXBlRXJyb3IoYFwiJHt2YWx1ZX1cIiBpcyBub3QgYSBzdHJpbmdgKSlcblxuVHlwZWQuU3ltYm9sID0gVHlwZWQoXCJTeW1ib2xcIiwgdmFsdWUgPT5cbiAgdHlwZW9mKHZhbHVlKSA9PT0gXCJzeW1ib2xcIiA/IHZhbHVlIDpcbiAgVHlwZUVycm9yKGBcIiR7dmFsdWV9XCIgaXMgbm90IGEgc3ltYm9sYCkpXG5cblR5cGVkLkFycmF5ID0gVHlwZWQoXCJBcnJheVwiLCB2YWx1ZSA9PlxuICBpc0FycmF5KHZhbHVlKSA/IHZhbHVlIDpcbiAgVHlwZUVycm9yKGBcIiR7dmFsdWV9XCIgaXMgbm90IGFuIGFycmF5YCkpXG5cblR5cGVkLlJlZ0V4cCA9IFR5cGVkKFwiUmVnRXhwXCIsIHZhbHVlID0+XG4gIHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwID8gdmFsdWUgOlxuICBUeXBlRXJyb3IoYFwiJHt2YWx1ZX1cIiBpcyBub3QgYSByZWdleHBgKSlcblxuVHlwZWQuQm9vbGVhbiA9IFR5cGVkKFwiQm9vbGVhblwiLCB2YWx1ZSA9PlxuICB2YWx1ZSA9PT0gdHJ1ZSA/IHRydWUgOlxuICB2YWx1ZSA9PT0gZmFsc2UgPyBmYWxzZSA6XG4gIFR5cGVFcnJvcihgXCIke3ZhbHVlfVwiIGlzIG5vdCBhIGJvb2xlYW5gKSlcblxuVHlwZWQuRGF0ZSA9IFR5cGVkKFwiRGF0ZVwiLCB2YWx1ZSA9PiB7XG4gIHZhciBkID0gbmV3IERhdGUodmFsdWUpXG4gIGlmIChpc05hTihkLnZhbHVlT2YoKSkpIHtcbiAgICByZXR1cm4gbmV3IFR5cGVFcnJvcihgXCIke3ZhbHVlfVwiIGlzIG5vdCBhIHZhbGlkIGRhdGUuYClcbiAgfVxuICByZXR1cm4gZFxufSlcblxuVHlwZWQuSW1tdXRhYmxlQ2xhc3MgPSBjbHMgPT4gVHlwZWQoYEltbXV0YWJsZS4ke2Nscy5uYW1lfWAsIHZhbHVlID0+IHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgY2xzKSB7XG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cbiAgZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJyB8fCB2YWx1ZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBuZXcgVHlwZUVycm9yKGBFeHBlY3RlZCAke2Nscy5uYW1lfTsgZ290IG5vdGhpbmcuYClcbiAgfVxuICBlbHNlIHtcbiAgICB0cnkgeyByZXR1cm4gbmV3IGNscyh2YWx1ZSk7IH1cbiAgICBjYXRjaCAoZXgpIHsgcmV0dXJuIGV4OyB9XG4gIH1cbn0pXG5cblxuY2xhc3MgTWF5YmVUeXBlIGV4dGVuZHMgVHlwZSB7XG4gIGNvbnN0cnVjdG9yKHR5cGUpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpc1skdHlwZV0gPSB0eXBlXG4gIH1cbiAgW1R5cGVkLnR5cGVOYW1lXSgpIHtcbiAgICByZXR1cm4gYE1heWJlKCR7dGhpc1skdHlwZV1bJHR5cGVOYW1lXSgpfSlgXG4gIH1cbiAgW1R5cGVkLnJlYWRdKHZhbHVlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gdmFsdWUgPT0gbnVsbCA/IG51bGwgOiB0aGlzWyR0eXBlXVskcmVhZF0odmFsdWUpXG5cbiAgICByZXR1cm4gIShyZXN1bHQgaW5zdGFuY2VvZiBUeXBlRXJyb3IpID8gcmVzdWx0IDpcbiAgICAgICAgICAgVHlwZUVycm9yKGBcIiR7dmFsdWV9XCIgaXMgbm90IG51bGx5IG5vciBpdCBpcyBvZiAke3RoaXNbJHR5cGVdWyR0eXBlTmFtZV0oKX0gdHlwZWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IE1heWJlID0gVHlwZSA9PiB7XG4gIGNvbnN0IHR5cGUgPSB0eXBlT2YoVHlwZSlcbiAgaWYgKHR5cGUgPT09IEFueSkge1xuICAgIHRocm93IFR5cGVFcnJvcihgJHtUeXBlfSBpcyBub3QgYSB2YWxpZCB0eXBlYClcbiAgfVxuXG4gIHJldHVybiB0eXBlWyRtYXliZV0gfHwgKHR5cGVbJG1heWJlXSA9IG5ldyBNYXliZVR5cGUodHlwZSkpXG59XG5NYXliZS5UeXBlID0gTWF5YmVUeXBlXG5cblxuY2xhc3MgVW5pb25UeXBlIGV4dGVuZHMgVHlwZSB7XG4gIGNvbnN0cnVjdG9yKHZhcmlhbnRzKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXNbJHR5cGVdID0gdmFyaWFudHNcbiAgfVxuICBbVHlwZWQudHlwZU5hbWVdKCkge1xuICAgIHJldHVybiBgVW5pb24oJHt0aGlzWyR0eXBlXS5tYXAodHlwZU5hbWUpLmpvaW4oJywgJyl9KWBcbiAgfVxuICBbVHlwZWQucmVhZF0odmFsdWUpIHtcbiAgICBjb25zdCB2YXJpYW50cyA9IHRoaXNbJHR5cGVdXG4gICAgY29uc3QgY291bnQgPSB2YXJpYW50cy5sZW5ndGhcbiAgICBsZXQgaW5kZXggPSAwXG4gICAgd2hpbGUgKGluZGV4IDwgY291bnQpIHtcbiAgICAgIGNvbnN0IHZhcmlhbnQgPSB2YXJpYW50c1tpbmRleF1cbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIHZhcmlhbnQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICB9XG4gICAgICBpbmRleCA9IGluZGV4ICsgMVxuICAgIH1cblxuICAgIGluZGV4ID0gMFxuICAgIHdoaWxlIChpbmRleCA8IGNvdW50KSB7XG4gICAgICBsZXQgcmVzdWx0XG4gICAgICB0cnkge1xuICAgICAgICByZXN1bHQgPSB2YXJpYW50c1tpbmRleF1bJHJlYWRdKHZhbHVlKVxuICAgICAgICBpZiAoIShyZXN1bHQgaW5zdGFuY2VvZiBUeXBlRXJyb3IpKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBpZiAoIShleCBpbnN0YW5jZW9mIFR5cGVFcnJvcikpIHtcbiAgICAgICAgICB0aHJvdyBleFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpbmRleCA9IGluZGV4ICsgMVxuICAgIH1cblxuICAgIHJldHVybiBUeXBlRXJyb3IoYFwiJHt2YWx1ZX1cIiBkb2VzIG5vdCBzYXRpc2Z5ICR7dGhpc1skdHlwZU5hbWVdKCl9IHR5cGVgKVxuICB9XG59XG5cbi8vIFJldHVybnMgYHhzYCBleGNsdWRpbmcgYW55IHZhbHVlcyB0aGF0IGFyZSBpbmNsdWRlZCBpbiBgeXNgLlxuY29uc3Qgc3VidHJhY3QgPSAoeHMsIHlzKSA9PlxuICB4cy5maWx0ZXIoeCA9PiB5cy5pbmRleE9mKHgpIDwgMClcblxuLy8gUmV0dXJucyBhcnJheSBpbmNsdWRpbmcgYWxsIHZhbHVlcyBmcm9tIGB4c2AgYW5kIGFsbCB2YWx1ZXMgZnJvbVxuLy8gYHlzYCB0aGF0IGFyZW4ndCBhbHJlYWR5IGluY2x1ZGVkIGluIGB4c2AuIEl0IHdpbGwgYWxzbyBhdHRlbXB0XG4vLyB0byByZXR1cm4gZWl0aGVyIGB4c2Agb3IgYHlzYCBpZiBvbmUgb2YgdGhlbSBpcyBhIHN1cGVyc2V0IG9mIG90aGVyLlxuLy8gcmV0dXJuIGB4c2Agb3IgYHlzYCBpZlxuY29uc3QgdW5pb24gPSAoeHMsIHlzKSA9PiB7XG4gIC8vIHhzIGNhbiBiZSBzdXBlcnNldCBvbmx5IGlmIGl0IGNvbnRhaW5zIG1vcmUgaXRlbXMgdGhlblxuICAvLyB5cy4gSWYgdGhhdCdzIGEgY2FzZSBmaW5kIGl0ZW1zIGluIHlzIHRoYXQgYXJlbnQgaW5jbHVkZWRcbiAgLy8gaW4geHMuIElmIHN1Y2ggaXRlbXMgZG8gbm90IGV4aXN0IHJldHVybiBiYWNrIGB4c2Agb3RoZXJ3aXNlXG4gIC8vIHJldHVybiBjb25jYXRpbmF0aW9uIG9mIHhzIHdpdGggdGhvc2UgaXRlbXMuXG4gIC8vIHRob3NlIGl0ZW1zXG4gIGlmICh4cy5sZW5ndGggPiB5cy5sZW5ndGgpIHtcbiAgICBjb25zdCBkaWZmID0gc3VidHJhY3QoeXMsIHhzKVxuICAgIHJldHVybiBkaWZmLmxlbmd0aCA9PT0gMCA/IHhzIDogeHMuY29uY2F0KGRpZmYpXG4gIH1cbiAgLy8gaWYgbnVtYmVyIG9mIGl0ZW1zIGluIHhzIGlzIG5vdCBncmVhdGVyIHRoYW4gbnVtYmVyIG9mIGl0ZW1zIGluIHlzXG4gIC8vIHRoZW4gZWl0aGVyIHhzIGlzIGVpdGhlciBzdWJzZXQgb3IgZXF1YWwgb2YgYHlzYC4gVGhlcmUgZm9yIHdlIGZpbmRcbiAgLy8geXMgdGhhdCBhcmUgbm90IGluY2x1ZGVkIGluIGB4c2AgaWYgc3VjaCBpdGVtcyBhcmVuJ3QgZm91bmQgeXMgaXNcbiAgLy8gZWl0aGVyIHN1cGVyc2V0IG9yIGVxdWFsIHNvIGp1c3QgcmV0dXJuIHlzIG90aGVyd2lzZSByZXR1cm4gY29uY2F0aW5hdGlvblxuICAvLyBvZiB0aG9zZSBpdGVtcyB3aXRoIGB5c2AuXG4gIGVsc2Uge1xuICAgIGNvbnN0IGRpZmYgPSBzdWJ0cmFjdCh4cywgeXMpXG4gICAgcmV0dXJuIGRpZmYubGVuZ3RoID09PSAwID8geXMgOiBkaWZmLmNvbmNhdCh5cylcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgVW5pb24gPSAoLi4uVHlwZXMpID0+IHtcbiAgY29uc3QgY291bnQgPSBUeXBlcy5sZW5ndGhcblxuICBpZiAoY291bnQgPT09IDApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoYFVuaW9uIG11c3QgYmUgb2YgYXQgYXQgbGVhc3Qgb25lIHR5cGVgKVxuICB9XG5cbiAgbGV0IHZhcmlhbnRzID0gbnVsbFxuICBsZXQgdHlwZSA9IG51bGxcbiAgbGV0IGluZGV4ID0gMDtcbiAgd2hpbGUgKGluZGV4IDwgY291bnQpIHtcbiAgICBjb25zdCB2YXJpYW50ID0gdHlwZU9mKFR5cGVzW2luZGV4XSlcbiAgICAvLyBJZiB0aGVyZSBpcyBgQW55YCBwcmVzZW50IHRoYW4gdW5pb24gaXMgYWxzbyBgQW55YC5cbiAgICBpZiAodmFyaWFudCA9PT0gQW55KSB7XG4gICAgICByZXR1cm4gQW55XG4gICAgfVxuICAgIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IHR5cGUgd2UgbWV0IHRoYW4gd2UgYXNzdW1lIGl0J3MgdGhlXG4gICAgLy8gb25lIHRoYXQgc2F0aXNmaWVzIGFsbCB0eXBlcy5cbiAgICBpZiAoIXZhcmlhbnRzKSB7XG4gICAgICB0eXBlID0gdmFyaWFudFxuICAgICAgdmFyaWFudHMgPSB0eXBlIGluc3RhbmNlb2YgVW5pb25UeXBlID8gdHlwZVskdHlwZV0gOiBbdmFyaWFudF1cbiAgICB9IGVsc2UgaWYgKHZhcmlhbnRzLmluZGV4T2YodmFyaWFudCkgPCAwKSB7XG4gICAgICAvLyBJZiBjdXJyZW50IHJlYWRlciBpcyBvZiB1bmlvbiB0eXBlXG4gICAgICBpZiAodmFyaWFudCBpbnN0YW5jZW9mIFVuaW9uVHlwZSkge1xuICAgICAgICBjb25zdCB2YXJpYW50VW5pb24gPSB1bmlvbih2YXJpYW50cywgdmFyaWFudFskdHlwZV0pXG5cbiAgICAgICAgLy8gSWYgYHJlYWRlci5yZWFkZXJzYCBtYXRjaGVzIHVuaW9uIG9mIHJlYWRlcnMsIHRoZW5cbiAgICAgICAgLy8gY3VycmVudCByZWFkZXIgaXMgYSBzdXBlcnNldCBzbyB3ZSB1c2UgaXQgYXMgYSB0eXBlXG4gICAgICAgIC8vIHRoYXQgc2F0aXNmaWVzIGFsbCB0eXBlcy5cbiAgICAgICAgaWYgKHZhcmlhbnRVbmlvbiA9PT0gdmFyaWFudFskdHlwZV0pIHtcbiAgICAgICAgICB0eXBlID0gdmFyaWFudFxuICAgICAgICAgIHZhcmlhbnRzID0gdmFyaWFudFVuaW9uXG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgY3VycmVudCByZWFkZXJzIGlzIG5vdCB0aGUgdW5pb24gdGhhbiBpdCBkb2VzIG5vdFxuICAgICAgICAvLyBzYXRpc2Z5IGN1cnJlbnR5IHJlYWRlci4gVGhlcmUgZm9yIHdlIHVwZGF0ZSByZWFkZXJzXG4gICAgICAgIC8vIGFuZCB1bnNldCBhIHR5cGUuXG4gICAgICAgIGVsc2UgaWYgKHZhcmlhbnRVbmlvbiAhPT0gdmFyaWFudHMpIHtcbiAgICAgICAgICB0eXBlID0gbnVsbFxuICAgICAgICAgIHZhcmlhbnRzID0gdmFyaWFudFVuaW9uXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR5cGUgPSBudWxsXG4gICAgICAgIHZhcmlhbnRzLnB1c2godmFyaWFudClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpbmRleCA9IGluZGV4ICsgMVxuICB9XG5cbiAgcmV0dXJuIHR5cGUgPyB0eXBlIDogbmV3IFVuaW9uVHlwZSh2YXJpYW50cylcbn1cblVuaW9uLlR5cGUgPSBVbmlvblR5cGVcblxuXG5UeXBlZC5OdW1iZXIuUmFuZ2UgPSAoZnJvbSwgdG89K0luZmluaXR5LCBkZWZhdWx0VmFsdWUpID0+XG4gIFR5cGVkKGBUeXBlZC5OdW1iZXIuUmFuZ2UoJHtmcm9tfS4uJHt0b30pYCwgdmFsdWUgPT4ge1xuICAgIGlmICh0eXBlb2YodmFsdWUpICE9PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuIFR5cGVFcnJvcihgXCIke3ZhbHVlfVwiIGlzIG5vdCBhIG51bWJlcmApXG4gICAgfVxuXG4gICAgaWYgKCEodmFsdWUgPj0gZnJvbSAmJiB2YWx1ZSA8PSB0bykpIHtcbiAgICAgIHJldHVybiBUeXBlRXJyb3IoYFwiJHt2YWx1ZX1cIiBpc24ndCBpbiB0aGUgcmFuZ2Ugb2YgJHtmcm9tfS4uJHt0b31gKVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZVxuICB9LCBkZWZhdWx0VmFsdWUpXG4iXX0=