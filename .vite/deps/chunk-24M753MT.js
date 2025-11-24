import {
  require_react_dom
} from "./chunk-EKFKCRXB.js";
import {
  require_react
} from "./chunk-ULSRCYB6.js";
import {
  __commonJS,
  __toESM
} from "./chunk-G3PMV62Z.js";

// node_modules/react/cjs/react-jsx-runtime.development.js
var require_react_jsx_runtime_development = __commonJS({
  "node_modules/react/cjs/react-jsx-runtime.development.js"(exports) {
    "use strict";
    (function() {
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x3) {
              }
          }
        return null;
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e11) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x3) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config2) {
        if (hasOwnProperty.call(config2, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config2, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config2.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function jsxDEVImpl(type, config2, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config2.children;
        if (void 0 !== children)
          if (isStaticChildren)
            if (isArrayImpl(children)) {
              for (isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)
                validateChildKeys(children[isStaticChildren]);
              Object.freeze && Object.freeze(children);
            } else
              console.error(
                "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
              );
          else validateChildKeys(children);
        if (hasOwnProperty.call(config2, "key")) {
          children = getComponentNameFromType(type);
          var keys = Object.keys(config2).filter(function(k4) {
            return "key" !== k4;
          });
          isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
          didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error(
            'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
            isStaticChildren,
            children,
            keys,
            children
          ), didWarnAboutKeySpread[children + isStaticChildren] = true);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config2) && (checkKeyStringCoercion(config2.key), children = "" + config2.key);
        if ("key" in config2) {
          maybeKey = {};
          for (var propName in config2)
            "key" !== propName && (maybeKey[propName] = config2[propName]);
        } else maybeKey = config2;
        children && defineKeyPropWarningGetter(
          maybeKey,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        return ReactElement(
          type,
          children,
          maybeKey,
          getOwner(),
          debugStack,
          debugTask
        );
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      var React3 = require_react(), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React3.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      React3 = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = React3.react_stack_bottom_frame.bind(
        React3,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutKeySpread = {};
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsx = function(type, config2, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(
          type,
          config2,
          maybeKey,
          false,
          trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.jsxs = function(type, config2, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(
          type,
          config2,
          maybeKey,
          true,
          trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
    })();
  }
});

// node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS({
  "node_modules/react/jsx-runtime.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_jsx_runtime_development();
    }
  }
});

// node_modules/lodash/_listCacheClear.js
var require_listCacheClear = __commonJS({
  "node_modules/lodash/_listCacheClear.js"(exports, module) {
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }
    module.exports = listCacheClear;
  }
});

// node_modules/lodash/eq.js
var require_eq = __commonJS({
  "node_modules/lodash/eq.js"(exports, module) {
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }
    module.exports = eq;
  }
});

// node_modules/lodash/_assocIndexOf.js
var require_assocIndexOf = __commonJS({
  "node_modules/lodash/_assocIndexOf.js"(exports, module) {
    var eq = require_eq();
    function assocIndexOf(array2, key) {
      var length = array2.length;
      while (length--) {
        if (eq(array2[length][0], key)) {
          return length;
        }
      }
      return -1;
    }
    module.exports = assocIndexOf;
  }
});

// node_modules/lodash/_listCacheDelete.js
var require_listCacheDelete = __commonJS({
  "node_modules/lodash/_listCacheDelete.js"(exports, module) {
    var assocIndexOf = require_assocIndexOf();
    var arrayProto = Array.prototype;
    var splice = arrayProto.splice;
    function listCacheDelete(key) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      if (index2 < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index2 == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index2, 1);
      }
      --this.size;
      return true;
    }
    module.exports = listCacheDelete;
  }
});

// node_modules/lodash/_listCacheGet.js
var require_listCacheGet = __commonJS({
  "node_modules/lodash/_listCacheGet.js"(exports, module) {
    var assocIndexOf = require_assocIndexOf();
    function listCacheGet(key) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      return index2 < 0 ? void 0 : data[index2][1];
    }
    module.exports = listCacheGet;
  }
});

// node_modules/lodash/_listCacheHas.js
var require_listCacheHas = __commonJS({
  "node_modules/lodash/_listCacheHas.js"(exports, module) {
    var assocIndexOf = require_assocIndexOf();
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }
    module.exports = listCacheHas;
  }
});

// node_modules/lodash/_listCacheSet.js
var require_listCacheSet = __commonJS({
  "node_modules/lodash/_listCacheSet.js"(exports, module) {
    var assocIndexOf = require_assocIndexOf();
    function listCacheSet(key, value) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      if (index2 < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index2][1] = value;
      }
      return this;
    }
    module.exports = listCacheSet;
  }
});

// node_modules/lodash/_ListCache.js
var require_ListCache = __commonJS({
  "node_modules/lodash/_ListCache.js"(exports, module) {
    var listCacheClear = require_listCacheClear();
    var listCacheDelete = require_listCacheDelete();
    var listCacheGet = require_listCacheGet();
    var listCacheHas = require_listCacheHas();
    var listCacheSet = require_listCacheSet();
    function ListCache(entries) {
      var index2 = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index2 < length) {
        var entry = entries[index2];
        this.set(entry[0], entry[1]);
      }
    }
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;
    module.exports = ListCache;
  }
});

// node_modules/lodash/_stackClear.js
var require_stackClear = __commonJS({
  "node_modules/lodash/_stackClear.js"(exports, module) {
    var ListCache = require_ListCache();
    function stackClear() {
      this.__data__ = new ListCache();
      this.size = 0;
    }
    module.exports = stackClear;
  }
});

// node_modules/lodash/_stackDelete.js
var require_stackDelete = __commonJS({
  "node_modules/lodash/_stackDelete.js"(exports, module) {
    function stackDelete(key) {
      var data = this.__data__, result = data["delete"](key);
      this.size = data.size;
      return result;
    }
    module.exports = stackDelete;
  }
});

// node_modules/lodash/_stackGet.js
var require_stackGet = __commonJS({
  "node_modules/lodash/_stackGet.js"(exports, module) {
    function stackGet(key) {
      return this.__data__.get(key);
    }
    module.exports = stackGet;
  }
});

// node_modules/lodash/_stackHas.js
var require_stackHas = __commonJS({
  "node_modules/lodash/_stackHas.js"(exports, module) {
    function stackHas(key) {
      return this.__data__.has(key);
    }
    module.exports = stackHas;
  }
});

// node_modules/lodash/_freeGlobal.js
var require_freeGlobal = __commonJS({
  "node_modules/lodash/_freeGlobal.js"(exports, module) {
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    module.exports = freeGlobal;
  }
});

// node_modules/lodash/_root.js
var require_root = __commonJS({
  "node_modules/lodash/_root.js"(exports, module) {
    var freeGlobal = require_freeGlobal();
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    module.exports = root;
  }
});

// node_modules/lodash/_Symbol.js
var require_Symbol = __commonJS({
  "node_modules/lodash/_Symbol.js"(exports, module) {
    var root = require_root();
    var Symbol3 = root.Symbol;
    module.exports = Symbol3;
  }
});

// node_modules/lodash/_getRawTag.js
var require_getRawTag = __commonJS({
  "node_modules/lodash/_getRawTag.js"(exports, module) {
    var Symbol3 = require_Symbol();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var nativeObjectToString = objectProto.toString;
    var symToStringTag = Symbol3 ? Symbol3.toStringTag : void 0;
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
      try {
        value[symToStringTag] = void 0;
        var unmasked = true;
      } catch (e11) {
      }
      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }
    module.exports = getRawTag;
  }
});

// node_modules/lodash/_objectToString.js
var require_objectToString = __commonJS({
  "node_modules/lodash/_objectToString.js"(exports, module) {
    var objectProto = Object.prototype;
    var nativeObjectToString = objectProto.toString;
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }
    module.exports = objectToString;
  }
});

// node_modules/lodash/_baseGetTag.js
var require_baseGetTag = __commonJS({
  "node_modules/lodash/_baseGetTag.js"(exports, module) {
    var Symbol3 = require_Symbol();
    var getRawTag = require_getRawTag();
    var objectToString = require_objectToString();
    var nullTag = "[object Null]";
    var undefinedTag = "[object Undefined]";
    var symToStringTag = Symbol3 ? Symbol3.toStringTag : void 0;
    function baseGetTag(value) {
      if (value == null) {
        return value === void 0 ? undefinedTag : nullTag;
      }
      return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
    }
    module.exports = baseGetTag;
  }
});

// node_modules/lodash/isObject.js
var require_isObject = __commonJS({
  "node_modules/lodash/isObject.js"(exports, module) {
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == "object" || type == "function");
    }
    module.exports = isObject;
  }
});

// node_modules/lodash/isFunction.js
var require_isFunction = __commonJS({
  "node_modules/lodash/isFunction.js"(exports, module) {
    var baseGetTag = require_baseGetTag();
    var isObject = require_isObject();
    var asyncTag = "[object AsyncFunction]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var proxyTag = "[object Proxy]";
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      var tag = baseGetTag(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }
    module.exports = isFunction;
  }
});

// node_modules/lodash/_coreJsData.js
var require_coreJsData = __commonJS({
  "node_modules/lodash/_coreJsData.js"(exports, module) {
    var root = require_root();
    var coreJsData = root["__core-js_shared__"];
    module.exports = coreJsData;
  }
});

// node_modules/lodash/_isMasked.js
var require_isMasked = __commonJS({
  "node_modules/lodash/_isMasked.js"(exports, module) {
    var coreJsData = require_coreJsData();
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
      return uid ? "Symbol(src)_1." + uid : "";
    })();
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }
    module.exports = isMasked;
  }
});

// node_modules/lodash/_toSource.js
var require_toSource = __commonJS({
  "node_modules/lodash/_toSource.js"(exports, module) {
    var funcProto = Function.prototype;
    var funcToString = funcProto.toString;
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e11) {
        }
        try {
          return func + "";
        } catch (e11) {
        }
      }
      return "";
    }
    module.exports = toSource;
  }
});

// node_modules/lodash/_baseIsNative.js
var require_baseIsNative = __commonJS({
  "node_modules/lodash/_baseIsNative.js"(exports, module) {
    var isFunction = require_isFunction();
    var isMasked = require_isMasked();
    var isObject = require_isObject();
    var toSource = require_toSource();
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var reIsNative = RegExp(
      "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    );
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }
    module.exports = baseIsNative;
  }
});

// node_modules/lodash/_getValue.js
var require_getValue = __commonJS({
  "node_modules/lodash/_getValue.js"(exports, module) {
    function getValue(object, key) {
      return object == null ? void 0 : object[key];
    }
    module.exports = getValue;
  }
});

// node_modules/lodash/_getNative.js
var require_getNative = __commonJS({
  "node_modules/lodash/_getNative.js"(exports, module) {
    var baseIsNative = require_baseIsNative();
    var getValue = require_getValue();
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : void 0;
    }
    module.exports = getNative;
  }
});

// node_modules/lodash/_Map.js
var require_Map = __commonJS({
  "node_modules/lodash/_Map.js"(exports, module) {
    var getNative = require_getNative();
    var root = require_root();
    var Map2 = getNative(root, "Map");
    module.exports = Map2;
  }
});

// node_modules/lodash/_nativeCreate.js
var require_nativeCreate = __commonJS({
  "node_modules/lodash/_nativeCreate.js"(exports, module) {
    var getNative = require_getNative();
    var nativeCreate = getNative(Object, "create");
    module.exports = nativeCreate;
  }
});

// node_modules/lodash/_hashClear.js
var require_hashClear = __commonJS({
  "node_modules/lodash/_hashClear.js"(exports, module) {
    var nativeCreate = require_nativeCreate();
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }
    module.exports = hashClear;
  }
});

// node_modules/lodash/_hashDelete.js
var require_hashDelete = __commonJS({
  "node_modules/lodash/_hashDelete.js"(exports, module) {
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }
    module.exports = hashDelete;
  }
});

// node_modules/lodash/_hashGet.js
var require_hashGet = __commonJS({
  "node_modules/lodash/_hashGet.js"(exports, module) {
    var nativeCreate = require_nativeCreate();
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? void 0 : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : void 0;
    }
    module.exports = hashGet;
  }
});

// node_modules/lodash/_hashHas.js
var require_hashHas = __commonJS({
  "node_modules/lodash/_hashHas.js"(exports, module) {
    var nativeCreate = require_nativeCreate();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
    }
    module.exports = hashHas;
  }
});

// node_modules/lodash/_hashSet.js
var require_hashSet = __commonJS({
  "node_modules/lodash/_hashSet.js"(exports, module) {
    var nativeCreate = require_nativeCreate();
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
      return this;
    }
    module.exports = hashSet;
  }
});

// node_modules/lodash/_Hash.js
var require_Hash = __commonJS({
  "node_modules/lodash/_Hash.js"(exports, module) {
    var hashClear = require_hashClear();
    var hashDelete = require_hashDelete();
    var hashGet = require_hashGet();
    var hashHas = require_hashHas();
    var hashSet = require_hashSet();
    function Hash(entries) {
      var index2 = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index2 < length) {
        var entry = entries[index2];
        this.set(entry[0], entry[1]);
      }
    }
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;
    module.exports = Hash;
  }
});

// node_modules/lodash/_mapCacheClear.js
var require_mapCacheClear = __commonJS({
  "node_modules/lodash/_mapCacheClear.js"(exports, module) {
    var Hash = require_Hash();
    var ListCache = require_ListCache();
    var Map2 = require_Map();
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        "hash": new Hash(),
        "map": new (Map2 || ListCache)(),
        "string": new Hash()
      };
    }
    module.exports = mapCacheClear;
  }
});

// node_modules/lodash/_isKeyable.js
var require_isKeyable = __commonJS({
  "node_modules/lodash/_isKeyable.js"(exports, module) {
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
    }
    module.exports = isKeyable;
  }
});

// node_modules/lodash/_getMapData.js
var require_getMapData = __commonJS({
  "node_modules/lodash/_getMapData.js"(exports, module) {
    var isKeyable = require_isKeyable();
    function getMapData(map4, key) {
      var data = map4.__data__;
      return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
    }
    module.exports = getMapData;
  }
});

// node_modules/lodash/_mapCacheDelete.js
var require_mapCacheDelete = __commonJS({
  "node_modules/lodash/_mapCacheDelete.js"(exports, module) {
    var getMapData = require_getMapData();
    function mapCacheDelete(key) {
      var result = getMapData(this, key)["delete"](key);
      this.size -= result ? 1 : 0;
      return result;
    }
    module.exports = mapCacheDelete;
  }
});

// node_modules/lodash/_mapCacheGet.js
var require_mapCacheGet = __commonJS({
  "node_modules/lodash/_mapCacheGet.js"(exports, module) {
    var getMapData = require_getMapData();
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }
    module.exports = mapCacheGet;
  }
});

// node_modules/lodash/_mapCacheHas.js
var require_mapCacheHas = __commonJS({
  "node_modules/lodash/_mapCacheHas.js"(exports, module) {
    var getMapData = require_getMapData();
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }
    module.exports = mapCacheHas;
  }
});

// node_modules/lodash/_mapCacheSet.js
var require_mapCacheSet = __commonJS({
  "node_modules/lodash/_mapCacheSet.js"(exports, module) {
    var getMapData = require_getMapData();
    function mapCacheSet(key, value) {
      var data = getMapData(this, key), size = data.size;
      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }
    module.exports = mapCacheSet;
  }
});

// node_modules/lodash/_MapCache.js
var require_MapCache = __commonJS({
  "node_modules/lodash/_MapCache.js"(exports, module) {
    var mapCacheClear = require_mapCacheClear();
    var mapCacheDelete = require_mapCacheDelete();
    var mapCacheGet = require_mapCacheGet();
    var mapCacheHas = require_mapCacheHas();
    var mapCacheSet = require_mapCacheSet();
    function MapCache(entries) {
      var index2 = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index2 < length) {
        var entry = entries[index2];
        this.set(entry[0], entry[1]);
      }
    }
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;
    module.exports = MapCache;
  }
});

// node_modules/lodash/_stackSet.js
var require_stackSet = __commonJS({
  "node_modules/lodash/_stackSet.js"(exports, module) {
    var ListCache = require_ListCache();
    var Map2 = require_Map();
    var MapCache = require_MapCache();
    var LARGE_ARRAY_SIZE = 200;
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs2 = data.__data__;
        if (!Map2 || pairs2.length < LARGE_ARRAY_SIZE - 1) {
          pairs2.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs2);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }
    module.exports = stackSet;
  }
});

// node_modules/lodash/_Stack.js
var require_Stack = __commonJS({
  "node_modules/lodash/_Stack.js"(exports, module) {
    var ListCache = require_ListCache();
    var stackClear = require_stackClear();
    var stackDelete = require_stackDelete();
    var stackGet = require_stackGet();
    var stackHas = require_stackHas();
    var stackSet = require_stackSet();
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }
    Stack.prototype.clear = stackClear;
    Stack.prototype["delete"] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;
    module.exports = Stack;
  }
});

// node_modules/lodash/_defineProperty.js
var require_defineProperty = __commonJS({
  "node_modules/lodash/_defineProperty.js"(exports, module) {
    var getNative = require_getNative();
    var defineProperty = (function() {
      try {
        var func = getNative(Object, "defineProperty");
        func({}, "", {});
        return func;
      } catch (e11) {
      }
    })();
    module.exports = defineProperty;
  }
});

// node_modules/lodash/_baseAssignValue.js
var require_baseAssignValue = __commonJS({
  "node_modules/lodash/_baseAssignValue.js"(exports, module) {
    var defineProperty = require_defineProperty();
    function baseAssignValue(object, key, value) {
      if (key == "__proto__" && defineProperty) {
        defineProperty(object, key, {
          "configurable": true,
          "enumerable": true,
          "value": value,
          "writable": true
        });
      } else {
        object[key] = value;
      }
    }
    module.exports = baseAssignValue;
  }
});

// node_modules/lodash/_assignMergeValue.js
var require_assignMergeValue = __commonJS({
  "node_modules/lodash/_assignMergeValue.js"(exports, module) {
    var baseAssignValue = require_baseAssignValue();
    var eq = require_eq();
    function assignMergeValue(object, key, value) {
      if (value !== void 0 && !eq(object[key], value) || value === void 0 && !(key in object)) {
        baseAssignValue(object, key, value);
      }
    }
    module.exports = assignMergeValue;
  }
});

// node_modules/lodash/_createBaseFor.js
var require_createBaseFor = __commonJS({
  "node_modules/lodash/_createBaseFor.js"(exports, module) {
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var index2 = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
        while (length--) {
          var key = props[fromRight ? length : ++index2];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }
    module.exports = createBaseFor;
  }
});

// node_modules/lodash/_baseFor.js
var require_baseFor = __commonJS({
  "node_modules/lodash/_baseFor.js"(exports, module) {
    var createBaseFor = require_createBaseFor();
    var baseFor = createBaseFor();
    module.exports = baseFor;
  }
});

// node_modules/lodash/_cloneBuffer.js
var require_cloneBuffer = __commonJS({
  "node_modules/lodash/_cloneBuffer.js"(exports, module) {
    var root = require_root();
    var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
    var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var Buffer = moduleExports ? root.Buffer : void 0;
    var allocUnsafe = Buffer ? Buffer.allocUnsafe : void 0;
    function cloneBuffer(buffer, isDeep) {
      if (isDeep) {
        return buffer.slice();
      }
      var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
      buffer.copy(result);
      return result;
    }
    module.exports = cloneBuffer;
  }
});

// node_modules/lodash/_Uint8Array.js
var require_Uint8Array = __commonJS({
  "node_modules/lodash/_Uint8Array.js"(exports, module) {
    var root = require_root();
    var Uint8Array = root.Uint8Array;
    module.exports = Uint8Array;
  }
});

// node_modules/lodash/_cloneArrayBuffer.js
var require_cloneArrayBuffer = __commonJS({
  "node_modules/lodash/_cloneArrayBuffer.js"(exports, module) {
    var Uint8Array = require_Uint8Array();
    function cloneArrayBuffer(arrayBuffer) {
      var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
      new Uint8Array(result).set(new Uint8Array(arrayBuffer));
      return result;
    }
    module.exports = cloneArrayBuffer;
  }
});

// node_modules/lodash/_cloneTypedArray.js
var require_cloneTypedArray = __commonJS({
  "node_modules/lodash/_cloneTypedArray.js"(exports, module) {
    var cloneArrayBuffer = require_cloneArrayBuffer();
    function cloneTypedArray(typedArray, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
      return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
    }
    module.exports = cloneTypedArray;
  }
});

// node_modules/lodash/_copyArray.js
var require_copyArray = __commonJS({
  "node_modules/lodash/_copyArray.js"(exports, module) {
    function copyArray(source, array2) {
      var index2 = -1, length = source.length;
      array2 || (array2 = Array(length));
      while (++index2 < length) {
        array2[index2] = source[index2];
      }
      return array2;
    }
    module.exports = copyArray;
  }
});

// node_modules/lodash/_baseCreate.js
var require_baseCreate = __commonJS({
  "node_modules/lodash/_baseCreate.js"(exports, module) {
    var isObject = require_isObject();
    var objectCreate = Object.create;
    var baseCreate = /* @__PURE__ */ (function() {
      function object() {
      }
      return function(proto) {
        if (!isObject(proto)) {
          return {};
        }
        if (objectCreate) {
          return objectCreate(proto);
        }
        object.prototype = proto;
        var result = new object();
        object.prototype = void 0;
        return result;
      };
    })();
    module.exports = baseCreate;
  }
});

// node_modules/lodash/_overArg.js
var require_overArg = __commonJS({
  "node_modules/lodash/_overArg.js"(exports, module) {
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    module.exports = overArg;
  }
});

// node_modules/lodash/_getPrototype.js
var require_getPrototype = __commonJS({
  "node_modules/lodash/_getPrototype.js"(exports, module) {
    var overArg = require_overArg();
    var getPrototype = overArg(Object.getPrototypeOf, Object);
    module.exports = getPrototype;
  }
});

// node_modules/lodash/_isPrototype.js
var require_isPrototype = __commonJS({
  "node_modules/lodash/_isPrototype.js"(exports, module) {
    var objectProto = Object.prototype;
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    module.exports = isPrototype;
  }
});

// node_modules/lodash/_initCloneObject.js
var require_initCloneObject = __commonJS({
  "node_modules/lodash/_initCloneObject.js"(exports, module) {
    var baseCreate = require_baseCreate();
    var getPrototype = require_getPrototype();
    var isPrototype = require_isPrototype();
    function initCloneObject(object) {
      return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
    }
    module.exports = initCloneObject;
  }
});

// node_modules/lodash/isObjectLike.js
var require_isObjectLike = __commonJS({
  "node_modules/lodash/isObjectLike.js"(exports, module) {
    function isObjectLike(value) {
      return value != null && typeof value == "object";
    }
    module.exports = isObjectLike;
  }
});

// node_modules/lodash/_baseIsArguments.js
var require_baseIsArguments = __commonJS({
  "node_modules/lodash/_baseIsArguments.js"(exports, module) {
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var argsTag = "[object Arguments]";
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }
    module.exports = baseIsArguments;
  }
});

// node_modules/lodash/isArguments.js
var require_isArguments = __commonJS({
  "node_modules/lodash/isArguments.js"(exports, module) {
    var baseIsArguments = require_baseIsArguments();
    var isObjectLike = require_isObjectLike();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var isArguments = baseIsArguments(/* @__PURE__ */ (function() {
      return arguments;
    })()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
    };
    module.exports = isArguments;
  }
});

// node_modules/lodash/isArray.js
var require_isArray = __commonJS({
  "node_modules/lodash/isArray.js"(exports, module) {
    var isArray = Array.isArray;
    module.exports = isArray;
  }
});

// node_modules/lodash/isLength.js
var require_isLength = __commonJS({
  "node_modules/lodash/isLength.js"(exports, module) {
    var MAX_SAFE_INTEGER = 9007199254740991;
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    module.exports = isLength;
  }
});

// node_modules/lodash/isArrayLike.js
var require_isArrayLike = __commonJS({
  "node_modules/lodash/isArrayLike.js"(exports, module) {
    var isFunction = require_isFunction();
    var isLength = require_isLength();
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    module.exports = isArrayLike;
  }
});

// node_modules/lodash/isArrayLikeObject.js
var require_isArrayLikeObject = __commonJS({
  "node_modules/lodash/isArrayLikeObject.js"(exports, module) {
    var isArrayLike = require_isArrayLike();
    var isObjectLike = require_isObjectLike();
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }
    module.exports = isArrayLikeObject;
  }
});

// node_modules/lodash/stubFalse.js
var require_stubFalse = __commonJS({
  "node_modules/lodash/stubFalse.js"(exports, module) {
    function stubFalse() {
      return false;
    }
    module.exports = stubFalse;
  }
});

// node_modules/lodash/isBuffer.js
var require_isBuffer = __commonJS({
  "node_modules/lodash/isBuffer.js"(exports, module) {
    var root = require_root();
    var stubFalse = require_stubFalse();
    var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
    var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var Buffer = moduleExports ? root.Buffer : void 0;
    var nativeIsBuffer = Buffer ? Buffer.isBuffer : void 0;
    var isBuffer = nativeIsBuffer || stubFalse;
    module.exports = isBuffer;
  }
});

// node_modules/lodash/isPlainObject.js
var require_isPlainObject = __commonJS({
  "node_modules/lodash/isPlainObject.js"(exports, module) {
    var baseGetTag = require_baseGetTag();
    var getPrototype = require_getPrototype();
    var isObjectLike = require_isObjectLike();
    var objectTag = "[object Object]";
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectCtorString = funcToString.call(Object);
    function isPlainObject(value) {
      if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
        return false;
      }
      var proto = getPrototype(value);
      if (proto === null) {
        return true;
      }
      var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
      return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
    }
    module.exports = isPlainObject;
  }
});

// node_modules/lodash/_baseIsTypedArray.js
var require_baseIsTypedArray = __commonJS({
  "node_modules/lodash/_baseIsTypedArray.js"(exports, module) {
    var baseGetTag = require_baseGetTag();
    var isLength = require_isLength();
    var isObjectLike = require_isObjectLike();
    var argsTag = "[object Arguments]";
    var arrayTag = "[object Array]";
    var boolTag = "[object Boolean]";
    var dateTag = "[object Date]";
    var errorTag = "[object Error]";
    var funcTag = "[object Function]";
    var mapTag = "[object Map]";
    var numberTag = "[object Number]";
    var objectTag = "[object Object]";
    var regexpTag = "[object RegExp]";
    var setTag = "[object Set]";
    var stringTag = "[object String]";
    var weakMapTag = "[object WeakMap]";
    var arrayBufferTag = "[object ArrayBuffer]";
    var dataViewTag = "[object DataView]";
    var float32Tag = "[object Float32Array]";
    var float64Tag = "[object Float64Array]";
    var int8Tag = "[object Int8Array]";
    var int16Tag = "[object Int16Array]";
    var int32Tag = "[object Int32Array]";
    var uint8Tag = "[object Uint8Array]";
    var uint8ClampedTag = "[object Uint8ClampedArray]";
    var uint16Tag = "[object Uint16Array]";
    var uint32Tag = "[object Uint32Array]";
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    function baseIsTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }
    module.exports = baseIsTypedArray;
  }
});

// node_modules/lodash/_baseUnary.js
var require_baseUnary = __commonJS({
  "node_modules/lodash/_baseUnary.js"(exports, module) {
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }
    module.exports = baseUnary;
  }
});

// node_modules/lodash/_nodeUtil.js
var require_nodeUtil = __commonJS({
  "node_modules/lodash/_nodeUtil.js"(exports, module) {
    var freeGlobal = require_freeGlobal();
    var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
    var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil = (function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e11) {
      }
    })();
    module.exports = nodeUtil;
  }
});

// node_modules/lodash/isTypedArray.js
var require_isTypedArray = __commonJS({
  "node_modules/lodash/isTypedArray.js"(exports, module) {
    var baseIsTypedArray = require_baseIsTypedArray();
    var baseUnary = require_baseUnary();
    var nodeUtil = require_nodeUtil();
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
    module.exports = isTypedArray;
  }
});

// node_modules/lodash/_safeGet.js
var require_safeGet = __commonJS({
  "node_modules/lodash/_safeGet.js"(exports, module) {
    function safeGet(object, key) {
      if (key === "constructor" && typeof object[key] === "function") {
        return;
      }
      if (key == "__proto__") {
        return;
      }
      return object[key];
    }
    module.exports = safeGet;
  }
});

// node_modules/lodash/_assignValue.js
var require_assignValue = __commonJS({
  "node_modules/lodash/_assignValue.js"(exports, module) {
    var baseAssignValue = require_baseAssignValue();
    var eq = require_eq();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === void 0 && !(key in object)) {
        baseAssignValue(object, key, value);
      }
    }
    module.exports = assignValue;
  }
});

// node_modules/lodash/_copyObject.js
var require_copyObject = __commonJS({
  "node_modules/lodash/_copyObject.js"(exports, module) {
    var assignValue = require_assignValue();
    var baseAssignValue = require_baseAssignValue();
    function copyObject(source, props, object, customizer) {
      var isNew = !object;
      object || (object = {});
      var index2 = -1, length = props.length;
      while (++index2 < length) {
        var key = props[index2];
        var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
        if (newValue === void 0) {
          newValue = source[key];
        }
        if (isNew) {
          baseAssignValue(object, key, newValue);
        } else {
          assignValue(object, key, newValue);
        }
      }
      return object;
    }
    module.exports = copyObject;
  }
});

// node_modules/lodash/_baseTimes.js
var require_baseTimes = __commonJS({
  "node_modules/lodash/_baseTimes.js"(exports, module) {
    function baseTimes(n8, iteratee) {
      var index2 = -1, result = Array(n8);
      while (++index2 < n8) {
        result[index2] = iteratee(index2);
      }
      return result;
    }
    module.exports = baseTimes;
  }
});

// node_modules/lodash/_isIndex.js
var require_isIndex = __commonJS({
  "node_modules/lodash/_isIndex.js"(exports, module) {
    var MAX_SAFE_INTEGER = 9007199254740991;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    module.exports = isIndex;
  }
});

// node_modules/lodash/_arrayLikeKeys.js
var require_arrayLikeKeys = __commonJS({
  "node_modules/lodash/_arrayLikeKeys.js"(exports, module) {
    var baseTimes = require_baseTimes();
    var isArguments = require_isArguments();
    var isArray = require_isArray();
    var isBuffer = require_isBuffer();
    var isIndex = require_isIndex();
    var isTypedArray = require_isTypedArray();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
        (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
        isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    module.exports = arrayLikeKeys;
  }
});

// node_modules/lodash/_nativeKeysIn.js
var require_nativeKeysIn = __commonJS({
  "node_modules/lodash/_nativeKeysIn.js"(exports, module) {
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }
    module.exports = nativeKeysIn;
  }
});

// node_modules/lodash/_baseKeysIn.js
var require_baseKeysIn = __commonJS({
  "node_modules/lodash/_baseKeysIn.js"(exports, module) {
    var isObject = require_isObject();
    var isPrototype = require_isPrototype();
    var nativeKeysIn = require_nativeKeysIn();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseKeysIn(object) {
      if (!isObject(object)) {
        return nativeKeysIn(object);
      }
      var isProto = isPrototype(object), result = [];
      for (var key in object) {
        if (!(key == "constructor" && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }
    module.exports = baseKeysIn;
  }
});

// node_modules/lodash/keysIn.js
var require_keysIn = __commonJS({
  "node_modules/lodash/keysIn.js"(exports, module) {
    var arrayLikeKeys = require_arrayLikeKeys();
    var baseKeysIn = require_baseKeysIn();
    var isArrayLike = require_isArrayLike();
    function keysIn(object) {
      return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
    }
    module.exports = keysIn;
  }
});

// node_modules/lodash/toPlainObject.js
var require_toPlainObject = __commonJS({
  "node_modules/lodash/toPlainObject.js"(exports, module) {
    var copyObject = require_copyObject();
    var keysIn = require_keysIn();
    function toPlainObject(value) {
      return copyObject(value, keysIn(value));
    }
    module.exports = toPlainObject;
  }
});

// node_modules/lodash/_baseMergeDeep.js
var require_baseMergeDeep = __commonJS({
  "node_modules/lodash/_baseMergeDeep.js"(exports, module) {
    var assignMergeValue = require_assignMergeValue();
    var cloneBuffer = require_cloneBuffer();
    var cloneTypedArray = require_cloneTypedArray();
    var copyArray = require_copyArray();
    var initCloneObject = require_initCloneObject();
    var isArguments = require_isArguments();
    var isArray = require_isArray();
    var isArrayLikeObject = require_isArrayLikeObject();
    var isBuffer = require_isBuffer();
    var isFunction = require_isFunction();
    var isObject = require_isObject();
    var isPlainObject = require_isPlainObject();
    var isTypedArray = require_isTypedArray();
    var safeGet = require_safeGet();
    var toPlainObject = require_toPlainObject();
    function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
      var objValue = safeGet(object, key), srcValue = safeGet(source, key), stacked = stack.get(srcValue);
      if (stacked) {
        assignMergeValue(object, key, stacked);
        return;
      }
      var newValue = customizer ? customizer(objValue, srcValue, key + "", object, source, stack) : void 0;
      var isCommon = newValue === void 0;
      if (isCommon) {
        var isArr = isArray(srcValue), isBuff = !isArr && isBuffer(srcValue), isTyped = !isArr && !isBuff && isTypedArray(srcValue);
        newValue = srcValue;
        if (isArr || isBuff || isTyped) {
          if (isArray(objValue)) {
            newValue = objValue;
          } else if (isArrayLikeObject(objValue)) {
            newValue = copyArray(objValue);
          } else if (isBuff) {
            isCommon = false;
            newValue = cloneBuffer(srcValue, true);
          } else if (isTyped) {
            isCommon = false;
            newValue = cloneTypedArray(srcValue, true);
          } else {
            newValue = [];
          }
        } else if (isPlainObject(srcValue) || isArguments(srcValue)) {
          newValue = objValue;
          if (isArguments(objValue)) {
            newValue = toPlainObject(objValue);
          } else if (!isObject(objValue) || isFunction(objValue)) {
            newValue = initCloneObject(srcValue);
          }
        } else {
          isCommon = false;
        }
      }
      if (isCommon) {
        stack.set(srcValue, newValue);
        mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
        stack["delete"](srcValue);
      }
      assignMergeValue(object, key, newValue);
    }
    module.exports = baseMergeDeep;
  }
});

// node_modules/lodash/_baseMerge.js
var require_baseMerge = __commonJS({
  "node_modules/lodash/_baseMerge.js"(exports, module) {
    var Stack = require_Stack();
    var assignMergeValue = require_assignMergeValue();
    var baseFor = require_baseFor();
    var baseMergeDeep = require_baseMergeDeep();
    var isObject = require_isObject();
    var keysIn = require_keysIn();
    var safeGet = require_safeGet();
    function baseMerge(object, source, srcIndex, customizer, stack) {
      if (object === source) {
        return;
      }
      baseFor(source, function(srcValue, key) {
        stack || (stack = new Stack());
        if (isObject(srcValue)) {
          baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
        } else {
          var newValue = customizer ? customizer(safeGet(object, key), srcValue, key + "", object, source, stack) : void 0;
          if (newValue === void 0) {
            newValue = srcValue;
          }
          assignMergeValue(object, key, newValue);
        }
      }, keysIn);
    }
    module.exports = baseMerge;
  }
});

// node_modules/lodash/identity.js
var require_identity = __commonJS({
  "node_modules/lodash/identity.js"(exports, module) {
    function identity5(value) {
      return value;
    }
    module.exports = identity5;
  }
});

// node_modules/lodash/_apply.js
var require_apply = __commonJS({
  "node_modules/lodash/_apply.js"(exports, module) {
    function apply(func, thisArg, args) {
      switch (args.length) {
        case 0:
          return func.call(thisArg);
        case 1:
          return func.call(thisArg, args[0]);
        case 2:
          return func.call(thisArg, args[0], args[1]);
        case 3:
          return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }
    module.exports = apply;
  }
});

// node_modules/lodash/_overRest.js
var require_overRest = __commonJS({
  "node_modules/lodash/_overRest.js"(exports, module) {
    var apply = require_apply();
    var nativeMax = Math.max;
    function overRest(func, start2, transform) {
      start2 = nativeMax(start2 === void 0 ? func.length - 1 : start2, 0);
      return function() {
        var args = arguments, index2 = -1, length = nativeMax(args.length - start2, 0), array2 = Array(length);
        while (++index2 < length) {
          array2[index2] = args[start2 + index2];
        }
        index2 = -1;
        var otherArgs = Array(start2 + 1);
        while (++index2 < start2) {
          otherArgs[index2] = args[index2];
        }
        otherArgs[start2] = transform(array2);
        return apply(func, this, otherArgs);
      };
    }
    module.exports = overRest;
  }
});

// node_modules/lodash/constant.js
var require_constant = __commonJS({
  "node_modules/lodash/constant.js"(exports, module) {
    function constant2(value) {
      return function() {
        return value;
      };
    }
    module.exports = constant2;
  }
});

// node_modules/lodash/_baseSetToString.js
var require_baseSetToString = __commonJS({
  "node_modules/lodash/_baseSetToString.js"(exports, module) {
    var constant2 = require_constant();
    var defineProperty = require_defineProperty();
    var identity5 = require_identity();
    var baseSetToString = !defineProperty ? identity5 : function(func, string) {
      return defineProperty(func, "toString", {
        "configurable": true,
        "enumerable": false,
        "value": constant2(string),
        "writable": true
      });
    };
    module.exports = baseSetToString;
  }
});

// node_modules/lodash/_shortOut.js
var require_shortOut = __commonJS({
  "node_modules/lodash/_shortOut.js"(exports, module) {
    var HOT_COUNT = 800;
    var HOT_SPAN = 16;
    var nativeNow = Date.now;
    function shortOut(func) {
      var count2 = 0, lastCalled = 0;
      return function() {
        var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
        lastCalled = stamp;
        if (remaining > 0) {
          if (++count2 >= HOT_COUNT) {
            return arguments[0];
          }
        } else {
          count2 = 0;
        }
        return func.apply(void 0, arguments);
      };
    }
    module.exports = shortOut;
  }
});

// node_modules/lodash/_setToString.js
var require_setToString = __commonJS({
  "node_modules/lodash/_setToString.js"(exports, module) {
    var baseSetToString = require_baseSetToString();
    var shortOut = require_shortOut();
    var setToString = shortOut(baseSetToString);
    module.exports = setToString;
  }
});

// node_modules/lodash/_baseRest.js
var require_baseRest = __commonJS({
  "node_modules/lodash/_baseRest.js"(exports, module) {
    var identity5 = require_identity();
    var overRest = require_overRest();
    var setToString = require_setToString();
    function baseRest(func, start2) {
      return setToString(overRest(func, start2, identity5), func + "");
    }
    module.exports = baseRest;
  }
});

// node_modules/lodash/_isIterateeCall.js
var require_isIterateeCall = __commonJS({
  "node_modules/lodash/_isIterateeCall.js"(exports, module) {
    var eq = require_eq();
    var isArrayLike = require_isArrayLike();
    var isIndex = require_isIndex();
    var isObject = require_isObject();
    function isIterateeCall(value, index2, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index2;
      if (type == "number" ? isArrayLike(object) && isIndex(index2, object.length) : type == "string" && index2 in object) {
        return eq(object[index2], value);
      }
      return false;
    }
    module.exports = isIterateeCall;
  }
});

// node_modules/lodash/_createAssigner.js
var require_createAssigner = __commonJS({
  "node_modules/lodash/_createAssigner.js"(exports, module) {
    var baseRest = require_baseRest();
    var isIterateeCall = require_isIterateeCall();
    function createAssigner(assigner) {
      return baseRest(function(object, sources) {
        var index2 = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : void 0, guard = length > 2 ? sources[2] : void 0;
        customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : void 0;
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? void 0 : customizer;
          length = 1;
        }
        object = Object(object);
        while (++index2 < length) {
          var source = sources[index2];
          if (source) {
            assigner(object, source, index2, customizer);
          }
        }
        return object;
      });
    }
    module.exports = createAssigner;
  }
});

// node_modules/lodash/merge.js
var require_merge = __commonJS({
  "node_modules/lodash/merge.js"(exports, module) {
    var baseMerge = require_baseMerge();
    var createAssigner = require_createAssigner();
    var merge2 = createAssigner(function(object, source, srcIndex) {
      baseMerge(object, source, srcIndex);
    });
    module.exports = merge2;
  }
});

// node_modules/lodash/isSymbol.js
var require_isSymbol = __commonJS({
  "node_modules/lodash/isSymbol.js"(exports, module) {
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var symbolTag = "[object Symbol]";
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
    }
    module.exports = isSymbol;
  }
});

// node_modules/lodash/_isKey.js
var require_isKey = __commonJS({
  "node_modules/lodash/_isKey.js"(exports, module) {
    var isArray = require_isArray();
    var isSymbol = require_isSymbol();
    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
    var reIsPlainProp = /^\w*$/;
    function isKey(value, object) {
      if (isArray(value)) {
        return false;
      }
      var type = typeof value;
      if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
        return true;
      }
      return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
    }
    module.exports = isKey;
  }
});

// node_modules/lodash/memoize.js
var require_memoize = __commonJS({
  "node_modules/lodash/memoize.js"(exports, module) {
    var MapCache = require_MapCache();
    var FUNC_ERROR_TEXT = "Expected a function";
    function memoize(func, resolver) {
      if (typeof func != "function" || resolver != null && typeof resolver != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result) || cache;
        return result;
      };
      memoized.cache = new (memoize.Cache || MapCache)();
      return memoized;
    }
    memoize.Cache = MapCache;
    module.exports = memoize;
  }
});

// node_modules/lodash/_memoizeCapped.js
var require_memoizeCapped = __commonJS({
  "node_modules/lodash/_memoizeCapped.js"(exports, module) {
    var memoize = require_memoize();
    var MAX_MEMOIZE_SIZE = 500;
    function memoizeCapped(func) {
      var result = memoize(func, function(key) {
        if (cache.size === MAX_MEMOIZE_SIZE) {
          cache.clear();
        }
        return key;
      });
      var cache = result.cache;
      return result;
    }
    module.exports = memoizeCapped;
  }
});

// node_modules/lodash/_stringToPath.js
var require_stringToPath = __commonJS({
  "node_modules/lodash/_stringToPath.js"(exports, module) {
    var memoizeCapped = require_memoizeCapped();
    var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
    var reEscapeChar = /\\(\\)?/g;
    var stringToPath = memoizeCapped(function(string) {
      var result = [];
      if (string.charCodeAt(0) === 46) {
        result.push("");
      }
      string.replace(rePropName, function(match, number4, quote, subString) {
        result.push(quote ? subString.replace(reEscapeChar, "$1") : number4 || match);
      });
      return result;
    });
    module.exports = stringToPath;
  }
});

// node_modules/lodash/_arrayMap.js
var require_arrayMap = __commonJS({
  "node_modules/lodash/_arrayMap.js"(exports, module) {
    function arrayMap(array2, iteratee) {
      var index2 = -1, length = array2 == null ? 0 : array2.length, result = Array(length);
      while (++index2 < length) {
        result[index2] = iteratee(array2[index2], index2, array2);
      }
      return result;
    }
    module.exports = arrayMap;
  }
});

// node_modules/lodash/_baseToString.js
var require_baseToString = __commonJS({
  "node_modules/lodash/_baseToString.js"(exports, module) {
    var Symbol3 = require_Symbol();
    var arrayMap = require_arrayMap();
    var isArray = require_isArray();
    var isSymbol = require_isSymbol();
    var INFINITY = 1 / 0;
    var symbolProto = Symbol3 ? Symbol3.prototype : void 0;
    var symbolToString = symbolProto ? symbolProto.toString : void 0;
    function baseToString(value) {
      if (typeof value == "string") {
        return value;
      }
      if (isArray(value)) {
        return arrayMap(value, baseToString) + "";
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : "";
      }
      var result = value + "";
      return result == "0" && 1 / value == -INFINITY ? "-0" : result;
    }
    module.exports = baseToString;
  }
});

// node_modules/lodash/toString.js
var require_toString = __commonJS({
  "node_modules/lodash/toString.js"(exports, module) {
    var baseToString = require_baseToString();
    function toString(value) {
      return value == null ? "" : baseToString(value);
    }
    module.exports = toString;
  }
});

// node_modules/lodash/_castPath.js
var require_castPath = __commonJS({
  "node_modules/lodash/_castPath.js"(exports, module) {
    var isArray = require_isArray();
    var isKey = require_isKey();
    var stringToPath = require_stringToPath();
    var toString = require_toString();
    function castPath(value, object) {
      if (isArray(value)) {
        return value;
      }
      return isKey(value, object) ? [value] : stringToPath(toString(value));
    }
    module.exports = castPath;
  }
});

// node_modules/lodash/_toKey.js
var require_toKey = __commonJS({
  "node_modules/lodash/_toKey.js"(exports, module) {
    var isSymbol = require_isSymbol();
    var INFINITY = 1 / 0;
    function toKey(value) {
      if (typeof value == "string" || isSymbol(value)) {
        return value;
      }
      var result = value + "";
      return result == "0" && 1 / value == -INFINITY ? "-0" : result;
    }
    module.exports = toKey;
  }
});

// node_modules/lodash/_baseGet.js
var require_baseGet = __commonJS({
  "node_modules/lodash/_baseGet.js"(exports, module) {
    var castPath = require_castPath();
    var toKey = require_toKey();
    function baseGet(object, path2) {
      path2 = castPath(path2, object);
      var index2 = 0, length = path2.length;
      while (object != null && index2 < length) {
        object = object[toKey(path2[index2++])];
      }
      return index2 && index2 == length ? object : void 0;
    }
    module.exports = baseGet;
  }
});

// node_modules/lodash/get.js
var require_get = __commonJS({
  "node_modules/lodash/get.js"(exports, module) {
    var baseGet = require_baseGet();
    function get(object, path2, defaultValue) {
      var result = object == null ? void 0 : baseGet(object, path2);
      return result === void 0 ? defaultValue : result;
    }
    module.exports = get;
  }
});

// node_modules/lodash/_baseSet.js
var require_baseSet = __commonJS({
  "node_modules/lodash/_baseSet.js"(exports, module) {
    var assignValue = require_assignValue();
    var castPath = require_castPath();
    var isIndex = require_isIndex();
    var isObject = require_isObject();
    var toKey = require_toKey();
    function baseSet(object, path2, value, customizer) {
      if (!isObject(object)) {
        return object;
      }
      path2 = castPath(path2, object);
      var index2 = -1, length = path2.length, lastIndex = length - 1, nested = object;
      while (nested != null && ++index2 < length) {
        var key = toKey(path2[index2]), newValue = value;
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          return object;
        }
        if (index2 != lastIndex) {
          var objValue = nested[key];
          newValue = customizer ? customizer(objValue, key, nested) : void 0;
          if (newValue === void 0) {
            newValue = isObject(objValue) ? objValue : isIndex(path2[index2 + 1]) ? [] : {};
          }
        }
        assignValue(nested, key, newValue);
        nested = nested[key];
      }
      return object;
    }
    module.exports = baseSet;
  }
});

// node_modules/lodash/set.js
var require_set = __commonJS({
  "node_modules/lodash/set.js"(exports, module) {
    var baseSet = require_baseSet();
    function set(object, path2, value) {
      return object == null ? object : baseSet(object, path2, value);
    }
    module.exports = set;
  }
});

// node_modules/lodash/isString.js
var require_isString = __commonJS({
  "node_modules/lodash/isString.js"(exports, module) {
    var baseGetTag = require_baseGetTag();
    var isArray = require_isArray();
    var isObjectLike = require_isObjectLike();
    var stringTag = "[object String]";
    function isString(value) {
      return typeof value == "string" || !isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag;
    }
    module.exports = isString;
  }
});

// node_modules/lodash/_setCacheAdd.js
var require_setCacheAdd = __commonJS({
  "node_modules/lodash/_setCacheAdd.js"(exports, module) {
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }
    module.exports = setCacheAdd;
  }
});

// node_modules/lodash/_setCacheHas.js
var require_setCacheHas = __commonJS({
  "node_modules/lodash/_setCacheHas.js"(exports, module) {
    function setCacheHas(value) {
      return this.__data__.has(value);
    }
    module.exports = setCacheHas;
  }
});

// node_modules/lodash/_SetCache.js
var require_SetCache = __commonJS({
  "node_modules/lodash/_SetCache.js"(exports, module) {
    var MapCache = require_MapCache();
    var setCacheAdd = require_setCacheAdd();
    var setCacheHas = require_setCacheHas();
    function SetCache(values) {
      var index2 = -1, length = values == null ? 0 : values.length;
      this.__data__ = new MapCache();
      while (++index2 < length) {
        this.add(values[index2]);
      }
    }
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;
    module.exports = SetCache;
  }
});

// node_modules/lodash/_baseFindIndex.js
var require_baseFindIndex = __commonJS({
  "node_modules/lodash/_baseFindIndex.js"(exports, module) {
    function baseFindIndex(array2, predicate, fromIndex, fromRight) {
      var length = array2.length, index2 = fromIndex + (fromRight ? 1 : -1);
      while (fromRight ? index2-- : ++index2 < length) {
        if (predicate(array2[index2], index2, array2)) {
          return index2;
        }
      }
      return -1;
    }
    module.exports = baseFindIndex;
  }
});

// node_modules/lodash/_baseIsNaN.js
var require_baseIsNaN = __commonJS({
  "node_modules/lodash/_baseIsNaN.js"(exports, module) {
    function baseIsNaN(value) {
      return value !== value;
    }
    module.exports = baseIsNaN;
  }
});

// node_modules/lodash/_strictIndexOf.js
var require_strictIndexOf = __commonJS({
  "node_modules/lodash/_strictIndexOf.js"(exports, module) {
    function strictIndexOf(array2, value, fromIndex) {
      var index2 = fromIndex - 1, length = array2.length;
      while (++index2 < length) {
        if (array2[index2] === value) {
          return index2;
        }
      }
      return -1;
    }
    module.exports = strictIndexOf;
  }
});

// node_modules/lodash/_baseIndexOf.js
var require_baseIndexOf = __commonJS({
  "node_modules/lodash/_baseIndexOf.js"(exports, module) {
    var baseFindIndex = require_baseFindIndex();
    var baseIsNaN = require_baseIsNaN();
    var strictIndexOf = require_strictIndexOf();
    function baseIndexOf(array2, value, fromIndex) {
      return value === value ? strictIndexOf(array2, value, fromIndex) : baseFindIndex(array2, baseIsNaN, fromIndex);
    }
    module.exports = baseIndexOf;
  }
});

// node_modules/lodash/_arrayIncludes.js
var require_arrayIncludes = __commonJS({
  "node_modules/lodash/_arrayIncludes.js"(exports, module) {
    var baseIndexOf = require_baseIndexOf();
    function arrayIncludes(array2, value) {
      var length = array2 == null ? 0 : array2.length;
      return !!length && baseIndexOf(array2, value, 0) > -1;
    }
    module.exports = arrayIncludes;
  }
});

// node_modules/lodash/_arrayIncludesWith.js
var require_arrayIncludesWith = __commonJS({
  "node_modules/lodash/_arrayIncludesWith.js"(exports, module) {
    function arrayIncludesWith(array2, value, comparator) {
      var index2 = -1, length = array2 == null ? 0 : array2.length;
      while (++index2 < length) {
        if (comparator(value, array2[index2])) {
          return true;
        }
      }
      return false;
    }
    module.exports = arrayIncludesWith;
  }
});

// node_modules/lodash/_cacheHas.js
var require_cacheHas = __commonJS({
  "node_modules/lodash/_cacheHas.js"(exports, module) {
    function cacheHas(cache, key) {
      return cache.has(key);
    }
    module.exports = cacheHas;
  }
});

// node_modules/lodash/_baseDifference.js
var require_baseDifference = __commonJS({
  "node_modules/lodash/_baseDifference.js"(exports, module) {
    var SetCache = require_SetCache();
    var arrayIncludes = require_arrayIncludes();
    var arrayIncludesWith = require_arrayIncludesWith();
    var arrayMap = require_arrayMap();
    var baseUnary = require_baseUnary();
    var cacheHas = require_cacheHas();
    var LARGE_ARRAY_SIZE = 200;
    function baseDifference(array2, values, iteratee, comparator) {
      var index2 = -1, includes = arrayIncludes, isCommon = true, length = array2.length, result = [], valuesLength = values.length;
      if (!length) {
        return result;
      }
      if (iteratee) {
        values = arrayMap(values, baseUnary(iteratee));
      }
      if (comparator) {
        includes = arrayIncludesWith;
        isCommon = false;
      } else if (values.length >= LARGE_ARRAY_SIZE) {
        includes = cacheHas;
        isCommon = false;
        values = new SetCache(values);
      }
      outer:
        while (++index2 < length) {
          var value = array2[index2], computed = iteratee == null ? value : iteratee(value);
          value = comparator || value !== 0 ? value : 0;
          if (isCommon && computed === computed) {
            var valuesIndex = valuesLength;
            while (valuesIndex--) {
              if (values[valuesIndex] === computed) {
                continue outer;
              }
            }
            result.push(value);
          } else if (!includes(values, computed, comparator)) {
            result.push(value);
          }
        }
      return result;
    }
    module.exports = baseDifference;
  }
});

// node_modules/lodash/without.js
var require_without = __commonJS({
  "node_modules/lodash/without.js"(exports, module) {
    var baseDifference = require_baseDifference();
    var baseRest = require_baseRest();
    var isArrayLikeObject = require_isArrayLikeObject();
    var without = baseRest(function(array2, values) {
      return isArrayLikeObject(array2) ? baseDifference(array2, values) : [];
    });
    module.exports = without;
  }
});

// node_modules/lodash/last.js
var require_last = __commonJS({
  "node_modules/lodash/last.js"(exports, module) {
    function last(array2) {
      var length = array2 == null ? 0 : array2.length;
      return length ? array2[length - 1] : void 0;
    }
    module.exports = last;
  }
});

// node_modules/lodash/_basePickBy.js
var require_basePickBy = __commonJS({
  "node_modules/lodash/_basePickBy.js"(exports, module) {
    var baseGet = require_baseGet();
    var baseSet = require_baseSet();
    var castPath = require_castPath();
    function basePickBy(object, paths, predicate) {
      var index2 = -1, length = paths.length, result = {};
      while (++index2 < length) {
        var path2 = paths[index2], value = baseGet(object, path2);
        if (predicate(value, path2)) {
          baseSet(result, castPath(path2, object), value);
        }
      }
      return result;
    }
    module.exports = basePickBy;
  }
});

// node_modules/lodash/_baseHasIn.js
var require_baseHasIn = __commonJS({
  "node_modules/lodash/_baseHasIn.js"(exports, module) {
    function baseHasIn(object, key) {
      return object != null && key in Object(object);
    }
    module.exports = baseHasIn;
  }
});

// node_modules/lodash/_hasPath.js
var require_hasPath = __commonJS({
  "node_modules/lodash/_hasPath.js"(exports, module) {
    var castPath = require_castPath();
    var isArguments = require_isArguments();
    var isArray = require_isArray();
    var isIndex = require_isIndex();
    var isLength = require_isLength();
    var toKey = require_toKey();
    function hasPath(object, path2, hasFunc) {
      path2 = castPath(path2, object);
      var index2 = -1, length = path2.length, result = false;
      while (++index2 < length) {
        var key = toKey(path2[index2]);
        if (!(result = object != null && hasFunc(object, key))) {
          break;
        }
        object = object[key];
      }
      if (result || ++index2 != length) {
        return result;
      }
      length = object == null ? 0 : object.length;
      return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
    }
    module.exports = hasPath;
  }
});

// node_modules/lodash/hasIn.js
var require_hasIn = __commonJS({
  "node_modules/lodash/hasIn.js"(exports, module) {
    var baseHasIn = require_baseHasIn();
    var hasPath = require_hasPath();
    function hasIn(object, path2) {
      return object != null && hasPath(object, path2, baseHasIn);
    }
    module.exports = hasIn;
  }
});

// node_modules/lodash/_basePick.js
var require_basePick = __commonJS({
  "node_modules/lodash/_basePick.js"(exports, module) {
    var basePickBy = require_basePickBy();
    var hasIn = require_hasIn();
    function basePick(object, paths) {
      return basePickBy(object, paths, function(value, path2) {
        return hasIn(object, path2);
      });
    }
    module.exports = basePick;
  }
});

// node_modules/lodash/_arrayPush.js
var require_arrayPush = __commonJS({
  "node_modules/lodash/_arrayPush.js"(exports, module) {
    function arrayPush(array2, values) {
      var index2 = -1, length = values.length, offset = array2.length;
      while (++index2 < length) {
        array2[offset + index2] = values[index2];
      }
      return array2;
    }
    module.exports = arrayPush;
  }
});

// node_modules/lodash/_isFlattenable.js
var require_isFlattenable = __commonJS({
  "node_modules/lodash/_isFlattenable.js"(exports, module) {
    var Symbol3 = require_Symbol();
    var isArguments = require_isArguments();
    var isArray = require_isArray();
    var spreadableSymbol = Symbol3 ? Symbol3.isConcatSpreadable : void 0;
    function isFlattenable(value) {
      return isArray(value) || isArguments(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
    }
    module.exports = isFlattenable;
  }
});

// node_modules/lodash/_baseFlatten.js
var require_baseFlatten = __commonJS({
  "node_modules/lodash/_baseFlatten.js"(exports, module) {
    var arrayPush = require_arrayPush();
    var isFlattenable = require_isFlattenable();
    function baseFlatten(array2, depth, predicate, isStrict, result) {
      var index2 = -1, length = array2.length;
      predicate || (predicate = isFlattenable);
      result || (result = []);
      while (++index2 < length) {
        var value = array2[index2];
        if (depth > 0 && predicate(value)) {
          if (depth > 1) {
            baseFlatten(value, depth - 1, predicate, isStrict, result);
          } else {
            arrayPush(result, value);
          }
        } else if (!isStrict) {
          result[result.length] = value;
        }
      }
      return result;
    }
    module.exports = baseFlatten;
  }
});

// node_modules/lodash/flatten.js
var require_flatten = __commonJS({
  "node_modules/lodash/flatten.js"(exports, module) {
    var baseFlatten = require_baseFlatten();
    function flatten(array2) {
      var length = array2 == null ? 0 : array2.length;
      return length ? baseFlatten(array2, 1) : [];
    }
    module.exports = flatten;
  }
});

// node_modules/lodash/_flatRest.js
var require_flatRest = __commonJS({
  "node_modules/lodash/_flatRest.js"(exports, module) {
    var flatten = require_flatten();
    var overRest = require_overRest();
    var setToString = require_setToString();
    function flatRest(func) {
      return setToString(overRest(func, void 0, flatten), func + "");
    }
    module.exports = flatRest;
  }
});

// node_modules/lodash/pick.js
var require_pick = __commonJS({
  "node_modules/lodash/pick.js"(exports, module) {
    var basePick = require_basePick();
    var flatRest = require_flatRest();
    var pick = flatRest(function(object, paths) {
      return object == null ? {} : basePick(object, paths);
    });
    module.exports = pick;
  }
});

// node_modules/lodash/_arraySome.js
var require_arraySome = __commonJS({
  "node_modules/lodash/_arraySome.js"(exports, module) {
    function arraySome(array2, predicate) {
      var index2 = -1, length = array2 == null ? 0 : array2.length;
      while (++index2 < length) {
        if (predicate(array2[index2], index2, array2)) {
          return true;
        }
      }
      return false;
    }
    module.exports = arraySome;
  }
});

// node_modules/lodash/_equalArrays.js
var require_equalArrays = __commonJS({
  "node_modules/lodash/_equalArrays.js"(exports, module) {
    var SetCache = require_SetCache();
    var arraySome = require_arraySome();
    var cacheHas = require_cacheHas();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function equalArrays(array2, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array2.length, othLength = other.length;
      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      var arrStacked = stack.get(array2);
      var othStacked = stack.get(other);
      if (arrStacked && othStacked) {
        return arrStacked == other && othStacked == array2;
      }
      var index2 = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
      stack.set(array2, other);
      stack.set(other, array2);
      while (++index2 < arrLength) {
        var arrValue = array2[index2], othValue = other[index2];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, arrValue, index2, other, array2, stack) : customizer(arrValue, othValue, index2, array2, other, stack);
        }
        if (compared !== void 0) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        if (seen) {
          if (!arraySome(other, function(othValue2, othIndex) {
            if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
            result = false;
            break;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
          result = false;
          break;
        }
      }
      stack["delete"](array2);
      stack["delete"](other);
      return result;
    }
    module.exports = equalArrays;
  }
});

// node_modules/lodash/_mapToArray.js
var require_mapToArray = __commonJS({
  "node_modules/lodash/_mapToArray.js"(exports, module) {
    function mapToArray(map4) {
      var index2 = -1, result = Array(map4.size);
      map4.forEach(function(value, key) {
        result[++index2] = [key, value];
      });
      return result;
    }
    module.exports = mapToArray;
  }
});

// node_modules/lodash/_setToArray.js
var require_setToArray = __commonJS({
  "node_modules/lodash/_setToArray.js"(exports, module) {
    function setToArray(set) {
      var index2 = -1, result = Array(set.size);
      set.forEach(function(value) {
        result[++index2] = value;
      });
      return result;
    }
    module.exports = setToArray;
  }
});

// node_modules/lodash/_equalByTag.js
var require_equalByTag = __commonJS({
  "node_modules/lodash/_equalByTag.js"(exports, module) {
    var Symbol3 = require_Symbol();
    var Uint8Array = require_Uint8Array();
    var eq = require_eq();
    var equalArrays = require_equalArrays();
    var mapToArray = require_mapToArray();
    var setToArray = require_setToArray();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    var boolTag = "[object Boolean]";
    var dateTag = "[object Date]";
    var errorTag = "[object Error]";
    var mapTag = "[object Map]";
    var numberTag = "[object Number]";
    var regexpTag = "[object RegExp]";
    var setTag = "[object Set]";
    var stringTag = "[object String]";
    var symbolTag = "[object Symbol]";
    var arrayBufferTag = "[object ArrayBuffer]";
    var dataViewTag = "[object DataView]";
    var symbolProto = Symbol3 ? Symbol3.prototype : void 0;
    var symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
    function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
      switch (tag) {
        case dataViewTag:
          if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;
        case arrayBufferTag:
          if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
            return false;
          }
          return true;
        case boolTag:
        case dateTag:
        case numberTag:
          return eq(+object, +other);
        case errorTag:
          return object.name == other.name && object.message == other.message;
        case regexpTag:
        case stringTag:
          return object == other + "";
        case mapTag:
          var convert = mapToArray;
        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
          convert || (convert = setToArray);
          if (object.size != other.size && !isPartial) {
            return false;
          }
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;
          stack.set(object, other);
          var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
          stack["delete"](object);
          return result;
        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }
    module.exports = equalByTag;
  }
});

// node_modules/lodash/_baseGetAllKeys.js
var require_baseGetAllKeys = __commonJS({
  "node_modules/lodash/_baseGetAllKeys.js"(exports, module) {
    var arrayPush = require_arrayPush();
    var isArray = require_isArray();
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
    }
    module.exports = baseGetAllKeys;
  }
});

// node_modules/lodash/_arrayFilter.js
var require_arrayFilter = __commonJS({
  "node_modules/lodash/_arrayFilter.js"(exports, module) {
    function arrayFilter(array2, predicate) {
      var index2 = -1, length = array2 == null ? 0 : array2.length, resIndex = 0, result = [];
      while (++index2 < length) {
        var value = array2[index2];
        if (predicate(value, index2, array2)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }
    module.exports = arrayFilter;
  }
});

// node_modules/lodash/stubArray.js
var require_stubArray = __commonJS({
  "node_modules/lodash/stubArray.js"(exports, module) {
    function stubArray() {
      return [];
    }
    module.exports = stubArray;
  }
});

// node_modules/lodash/_getSymbols.js
var require_getSymbols = __commonJS({
  "node_modules/lodash/_getSymbols.js"(exports, module) {
    var arrayFilter = require_arrayFilter();
    var stubArray = require_stubArray();
    var objectProto = Object.prototype;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var nativeGetSymbols = Object.getOwnPropertySymbols;
    var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
      if (object == null) {
        return [];
      }
      object = Object(object);
      return arrayFilter(nativeGetSymbols(object), function(symbol) {
        return propertyIsEnumerable.call(object, symbol);
      });
    };
    module.exports = getSymbols;
  }
});

// node_modules/lodash/_nativeKeys.js
var require_nativeKeys = __commonJS({
  "node_modules/lodash/_nativeKeys.js"(exports, module) {
    var overArg = require_overArg();
    var nativeKeys = overArg(Object.keys, Object);
    module.exports = nativeKeys;
  }
});

// node_modules/lodash/_baseKeys.js
var require_baseKeys = __commonJS({
  "node_modules/lodash/_baseKeys.js"(exports, module) {
    var isPrototype = require_isPrototype();
    var nativeKeys = require_nativeKeys();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }
    module.exports = baseKeys;
  }
});

// node_modules/lodash/keys.js
var require_keys = __commonJS({
  "node_modules/lodash/keys.js"(exports, module) {
    var arrayLikeKeys = require_arrayLikeKeys();
    var baseKeys = require_baseKeys();
    var isArrayLike = require_isArrayLike();
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }
    module.exports = keys;
  }
});

// node_modules/lodash/_getAllKeys.js
var require_getAllKeys = __commonJS({
  "node_modules/lodash/_getAllKeys.js"(exports, module) {
    var baseGetAllKeys = require_baseGetAllKeys();
    var getSymbols = require_getSymbols();
    var keys = require_keys();
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols);
    }
    module.exports = getAllKeys;
  }
});

// node_modules/lodash/_equalObjects.js
var require_equalObjects = __commonJS({
  "node_modules/lodash/_equalObjects.js"(exports, module) {
    var getAllKeys = require_getAllKeys();
    var COMPARE_PARTIAL_FLAG = 1;
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index2 = objLength;
      while (index2--) {
        var key = objProps[index2];
        if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      var objStacked = stack.get(object);
      var othStacked = stack.get(other);
      if (objStacked && othStacked) {
        return objStacked == other && othStacked == object;
      }
      var result = true;
      stack.set(object, other);
      stack.set(other, object);
      var skipCtor = isPartial;
      while (++index2 < objLength) {
        key = objProps[index2];
        var objValue = object[key], othValue = other[key];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
        }
        if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == "constructor");
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor, othCtor = other.constructor;
        if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack["delete"](object);
      stack["delete"](other);
      return result;
    }
    module.exports = equalObjects;
  }
});

// node_modules/lodash/_DataView.js
var require_DataView = __commonJS({
  "node_modules/lodash/_DataView.js"(exports, module) {
    var getNative = require_getNative();
    var root = require_root();
    var DataView2 = getNative(root, "DataView");
    module.exports = DataView2;
  }
});

// node_modules/lodash/_Promise.js
var require_Promise = __commonJS({
  "node_modules/lodash/_Promise.js"(exports, module) {
    var getNative = require_getNative();
    var root = require_root();
    var Promise2 = getNative(root, "Promise");
    module.exports = Promise2;
  }
});

// node_modules/lodash/_Set.js
var require_Set = __commonJS({
  "node_modules/lodash/_Set.js"(exports, module) {
    var getNative = require_getNative();
    var root = require_root();
    var Set2 = getNative(root, "Set");
    module.exports = Set2;
  }
});

// node_modules/lodash/_WeakMap.js
var require_WeakMap = __commonJS({
  "node_modules/lodash/_WeakMap.js"(exports, module) {
    var getNative = require_getNative();
    var root = require_root();
    var WeakMap2 = getNative(root, "WeakMap");
    module.exports = WeakMap2;
  }
});

// node_modules/lodash/_getTag.js
var require_getTag = __commonJS({
  "node_modules/lodash/_getTag.js"(exports, module) {
    var DataView2 = require_DataView();
    var Map2 = require_Map();
    var Promise2 = require_Promise();
    var Set2 = require_Set();
    var WeakMap2 = require_WeakMap();
    var baseGetTag = require_baseGetTag();
    var toSource = require_toSource();
    var mapTag = "[object Map]";
    var objectTag = "[object Object]";
    var promiseTag = "[object Promise]";
    var setTag = "[object Set]";
    var weakMapTag = "[object WeakMap]";
    var dataViewTag = "[object DataView]";
    var dataViewCtorString = toSource(DataView2);
    var mapCtorString = toSource(Map2);
    var promiseCtorString = toSource(Promise2);
    var setCtorString = toSource(Set2);
    var weakMapCtorString = toSource(WeakMap2);
    var getTag = baseGetTag;
    if (DataView2 && getTag(new DataView2(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap2 && getTag(new WeakMap2()) != weakMapTag) {
      getTag = function(value) {
        var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString:
              return dataViewTag;
            case mapCtorString:
              return mapTag;
            case promiseCtorString:
              return promiseTag;
            case setCtorString:
              return setTag;
            case weakMapCtorString:
              return weakMapTag;
          }
        }
        return result;
      };
    }
    module.exports = getTag;
  }
});

// node_modules/lodash/_baseIsEqualDeep.js
var require_baseIsEqualDeep = __commonJS({
  "node_modules/lodash/_baseIsEqualDeep.js"(exports, module) {
    var Stack = require_Stack();
    var equalArrays = require_equalArrays();
    var equalByTag = require_equalByTag();
    var equalObjects = require_equalObjects();
    var getTag = require_getTag();
    var isArray = require_isArray();
    var isBuffer = require_isBuffer();
    var isTypedArray = require_isTypedArray();
    var COMPARE_PARTIAL_FLAG = 1;
    var argsTag = "[object Arguments]";
    var arrayTag = "[object Array]";
    var objectTag = "[object Object]";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
      var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;
      var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
      if (isSameTag && isBuffer(object)) {
        if (!isBuffer(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack());
        return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
          stack || (stack = new Stack());
          return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack());
      return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
    }
    module.exports = baseIsEqualDeep;
  }
});

// node_modules/lodash/_baseIsEqual.js
var require_baseIsEqual = __commonJS({
  "node_modules/lodash/_baseIsEqual.js"(exports, module) {
    var baseIsEqualDeep = require_baseIsEqualDeep();
    var isObjectLike = require_isObjectLike();
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
    }
    module.exports = baseIsEqual;
  }
});

// node_modules/lodash/isEqual.js
var require_isEqual = __commonJS({
  "node_modules/lodash/isEqual.js"(exports, module) {
    var baseIsEqual = require_baseIsEqual();
    function isEqual2(value, other) {
      return baseIsEqual(value, other);
    }
    module.exports = isEqual2;
  }
});

// node_modules/lodash/_baseIsMatch.js
var require_baseIsMatch = __commonJS({
  "node_modules/lodash/_baseIsMatch.js"(exports, module) {
    var Stack = require_Stack();
    var baseIsEqual = require_baseIsEqual();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function baseIsMatch(object, source, matchData, customizer) {
      var index2 = matchData.length, length = index2, noCustomizer = !customizer;
      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (index2--) {
        var data = matchData[index2];
        if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
          return false;
        }
      }
      while (++index2 < length) {
        data = matchData[index2];
        var key = data[0], objValue = object[key], srcValue = data[1];
        if (noCustomizer && data[2]) {
          if (objValue === void 0 && !(key in object)) {
            return false;
          }
        } else {
          var stack = new Stack();
          if (customizer) {
            var result = customizer(objValue, srcValue, key, object, source, stack);
          }
          if (!(result === void 0 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result)) {
            return false;
          }
        }
      }
      return true;
    }
    module.exports = baseIsMatch;
  }
});

// node_modules/lodash/_isStrictComparable.js
var require_isStrictComparable = __commonJS({
  "node_modules/lodash/_isStrictComparable.js"(exports, module) {
    var isObject = require_isObject();
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }
    module.exports = isStrictComparable;
  }
});

// node_modules/lodash/_getMatchData.js
var require_getMatchData = __commonJS({
  "node_modules/lodash/_getMatchData.js"(exports, module) {
    var isStrictComparable = require_isStrictComparable();
    var keys = require_keys();
    function getMatchData(object) {
      var result = keys(object), length = result.length;
      while (length--) {
        var key = result[length], value = object[key];
        result[length] = [key, value, isStrictComparable(value)];
      }
      return result;
    }
    module.exports = getMatchData;
  }
});

// node_modules/lodash/_matchesStrictComparable.js
var require_matchesStrictComparable = __commonJS({
  "node_modules/lodash/_matchesStrictComparable.js"(exports, module) {
    function matchesStrictComparable(key, srcValue) {
      return function(object) {
        if (object == null) {
          return false;
        }
        return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
      };
    }
    module.exports = matchesStrictComparable;
  }
});

// node_modules/lodash/_baseMatches.js
var require_baseMatches = __commonJS({
  "node_modules/lodash/_baseMatches.js"(exports, module) {
    var baseIsMatch = require_baseIsMatch();
    var getMatchData = require_getMatchData();
    var matchesStrictComparable = require_matchesStrictComparable();
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        return matchesStrictComparable(matchData[0][0], matchData[0][1]);
      }
      return function(object) {
        return object === source || baseIsMatch(object, source, matchData);
      };
    }
    module.exports = baseMatches;
  }
});

// node_modules/lodash/_baseMatchesProperty.js
var require_baseMatchesProperty = __commonJS({
  "node_modules/lodash/_baseMatchesProperty.js"(exports, module) {
    var baseIsEqual = require_baseIsEqual();
    var get = require_get();
    var hasIn = require_hasIn();
    var isKey = require_isKey();
    var isStrictComparable = require_isStrictComparable();
    var matchesStrictComparable = require_matchesStrictComparable();
    var toKey = require_toKey();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function baseMatchesProperty(path2, srcValue) {
      if (isKey(path2) && isStrictComparable(srcValue)) {
        return matchesStrictComparable(toKey(path2), srcValue);
      }
      return function(object) {
        var objValue = get(object, path2);
        return objValue === void 0 && objValue === srcValue ? hasIn(object, path2) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
      };
    }
    module.exports = baseMatchesProperty;
  }
});

// node_modules/lodash/_baseProperty.js
var require_baseProperty = __commonJS({
  "node_modules/lodash/_baseProperty.js"(exports, module) {
    function baseProperty(key) {
      return function(object) {
        return object == null ? void 0 : object[key];
      };
    }
    module.exports = baseProperty;
  }
});

// node_modules/lodash/_basePropertyDeep.js
var require_basePropertyDeep = __commonJS({
  "node_modules/lodash/_basePropertyDeep.js"(exports, module) {
    var baseGet = require_baseGet();
    function basePropertyDeep(path2) {
      return function(object) {
        return baseGet(object, path2);
      };
    }
    module.exports = basePropertyDeep;
  }
});

// node_modules/lodash/property.js
var require_property = __commonJS({
  "node_modules/lodash/property.js"(exports, module) {
    var baseProperty = require_baseProperty();
    var basePropertyDeep = require_basePropertyDeep();
    var isKey = require_isKey();
    var toKey = require_toKey();
    function property(path2) {
      return isKey(path2) ? baseProperty(toKey(path2)) : basePropertyDeep(path2);
    }
    module.exports = property;
  }
});

// node_modules/lodash/_baseIteratee.js
var require_baseIteratee = __commonJS({
  "node_modules/lodash/_baseIteratee.js"(exports, module) {
    var baseMatches = require_baseMatches();
    var baseMatchesProperty = require_baseMatchesProperty();
    var identity5 = require_identity();
    var isArray = require_isArray();
    var property = require_property();
    function baseIteratee(value) {
      if (typeof value == "function") {
        return value;
      }
      if (value == null) {
        return identity5;
      }
      if (typeof value == "object") {
        return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
      }
      return property(value);
    }
    module.exports = baseIteratee;
  }
});

// node_modules/lodash/noop.js
var require_noop = __commonJS({
  "node_modules/lodash/noop.js"(exports, module) {
    function noop2() {
    }
    module.exports = noop2;
  }
});

// node_modules/lodash/_createSet.js
var require_createSet = __commonJS({
  "node_modules/lodash/_createSet.js"(exports, module) {
    var Set2 = require_Set();
    var noop2 = require_noop();
    var setToArray = require_setToArray();
    var INFINITY = 1 / 0;
    var createSet = !(Set2 && 1 / setToArray(new Set2([, -0]))[1] == INFINITY) ? noop2 : function(values) {
      return new Set2(values);
    };
    module.exports = createSet;
  }
});

// node_modules/lodash/_baseUniq.js
var require_baseUniq = __commonJS({
  "node_modules/lodash/_baseUniq.js"(exports, module) {
    var SetCache = require_SetCache();
    var arrayIncludes = require_arrayIncludes();
    var arrayIncludesWith = require_arrayIncludesWith();
    var cacheHas = require_cacheHas();
    var createSet = require_createSet();
    var setToArray = require_setToArray();
    var LARGE_ARRAY_SIZE = 200;
    function baseUniq(array2, iteratee, comparator) {
      var index2 = -1, includes = arrayIncludes, length = array2.length, isCommon = true, result = [], seen = result;
      if (comparator) {
        isCommon = false;
        includes = arrayIncludesWith;
      } else if (length >= LARGE_ARRAY_SIZE) {
        var set = iteratee ? null : createSet(array2);
        if (set) {
          return setToArray(set);
        }
        isCommon = false;
        includes = cacheHas;
        seen = new SetCache();
      } else {
        seen = iteratee ? [] : result;
      }
      outer:
        while (++index2 < length) {
          var value = array2[index2], computed = iteratee ? iteratee(value) : value;
          value = comparator || value !== 0 ? value : 0;
          if (isCommon && computed === computed) {
            var seenIndex = seen.length;
            while (seenIndex--) {
              if (seen[seenIndex] === computed) {
                continue outer;
              }
            }
            if (iteratee) {
              seen.push(computed);
            }
            result.push(value);
          } else if (!includes(seen, computed, comparator)) {
            if (seen !== result) {
              seen.push(computed);
            }
            result.push(value);
          }
        }
      return result;
    }
    module.exports = baseUniq;
  }
});

// node_modules/lodash/uniqBy.js
var require_uniqBy = __commonJS({
  "node_modules/lodash/uniqBy.js"(exports, module) {
    var baseIteratee = require_baseIteratee();
    var baseUniq = require_baseUniq();
    function uniqBy(array2, iteratee) {
      return array2 && array2.length ? baseUniq(array2, baseIteratee(iteratee, 2)) : [];
    }
    module.exports = uniqBy;
  }
});

// node_modules/lodash/uniq.js
var require_uniq = __commonJS({
  "node_modules/lodash/uniq.js"(exports, module) {
    var baseUniq = require_baseUniq();
    function uniq(array2) {
      return array2 && array2.length ? baseUniq(array2) : [];
    }
    module.exports = uniq;
  }
});

// node_modules/lodash/_baseForOwn.js
var require_baseForOwn = __commonJS({
  "node_modules/lodash/_baseForOwn.js"(exports, module) {
    var baseFor = require_baseFor();
    var keys = require_keys();
    function baseForOwn(object, iteratee) {
      return object && baseFor(object, iteratee, keys);
    }
    module.exports = baseForOwn;
  }
});

// node_modules/lodash/_createBaseEach.js
var require_createBaseEach = __commonJS({
  "node_modules/lodash/_createBaseEach.js"(exports, module) {
    var isArrayLike = require_isArrayLike();
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        if (collection == null) {
          return collection;
        }
        if (!isArrayLike(collection)) {
          return eachFunc(collection, iteratee);
        }
        var length = collection.length, index2 = fromRight ? length : -1, iterable = Object(collection);
        while (fromRight ? index2-- : ++index2 < length) {
          if (iteratee(iterable[index2], index2, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }
    module.exports = createBaseEach;
  }
});

// node_modules/lodash/_baseEach.js
var require_baseEach = __commonJS({
  "node_modules/lodash/_baseEach.js"(exports, module) {
    var baseForOwn = require_baseForOwn();
    var createBaseEach = require_createBaseEach();
    var baseEach = createBaseEach(baseForOwn);
    module.exports = baseEach;
  }
});

// node_modules/lodash/_baseMap.js
var require_baseMap = __commonJS({
  "node_modules/lodash/_baseMap.js"(exports, module) {
    var baseEach = require_baseEach();
    var isArrayLike = require_isArrayLike();
    function baseMap(collection, iteratee) {
      var index2 = -1, result = isArrayLike(collection) ? Array(collection.length) : [];
      baseEach(collection, function(value, key, collection2) {
        result[++index2] = iteratee(value, key, collection2);
      });
      return result;
    }
    module.exports = baseMap;
  }
});

// node_modules/lodash/_baseSortBy.js
var require_baseSortBy = __commonJS({
  "node_modules/lodash/_baseSortBy.js"(exports, module) {
    function baseSortBy(array2, comparer) {
      var length = array2.length;
      array2.sort(comparer);
      while (length--) {
        array2[length] = array2[length].value;
      }
      return array2;
    }
    module.exports = baseSortBy;
  }
});

// node_modules/lodash/_compareAscending.js
var require_compareAscending = __commonJS({
  "node_modules/lodash/_compareAscending.js"(exports, module) {
    var isSymbol = require_isSymbol();
    function compareAscending(value, other) {
      if (value !== other) {
        var valIsDefined = value !== void 0, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol(value);
        var othIsDefined = other !== void 0, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol(other);
        if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
          return 1;
        }
        if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
          return -1;
        }
      }
      return 0;
    }
    module.exports = compareAscending;
  }
});

// node_modules/lodash/_compareMultiple.js
var require_compareMultiple = __commonJS({
  "node_modules/lodash/_compareMultiple.js"(exports, module) {
    var compareAscending = require_compareAscending();
    function compareMultiple(object, other, orders) {
      var index2 = -1, objCriteria = object.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
      while (++index2 < length) {
        var result = compareAscending(objCriteria[index2], othCriteria[index2]);
        if (result) {
          if (index2 >= ordersLength) {
            return result;
          }
          var order = orders[index2];
          return result * (order == "desc" ? -1 : 1);
        }
      }
      return object.index - other.index;
    }
    module.exports = compareMultiple;
  }
});

// node_modules/lodash/_baseOrderBy.js
var require_baseOrderBy = __commonJS({
  "node_modules/lodash/_baseOrderBy.js"(exports, module) {
    var arrayMap = require_arrayMap();
    var baseGet = require_baseGet();
    var baseIteratee = require_baseIteratee();
    var baseMap = require_baseMap();
    var baseSortBy = require_baseSortBy();
    var baseUnary = require_baseUnary();
    var compareMultiple = require_compareMultiple();
    var identity5 = require_identity();
    var isArray = require_isArray();
    function baseOrderBy(collection, iteratees, orders) {
      if (iteratees.length) {
        iteratees = arrayMap(iteratees, function(iteratee) {
          if (isArray(iteratee)) {
            return function(value) {
              return baseGet(value, iteratee.length === 1 ? iteratee[0] : iteratee);
            };
          }
          return iteratee;
        });
      } else {
        iteratees = [identity5];
      }
      var index2 = -1;
      iteratees = arrayMap(iteratees, baseUnary(baseIteratee));
      var result = baseMap(collection, function(value, key, collection2) {
        var criteria = arrayMap(iteratees, function(iteratee) {
          return iteratee(value);
        });
        return { "criteria": criteria, "index": ++index2, "value": value };
      });
      return baseSortBy(result, function(object, other) {
        return compareMultiple(object, other, orders);
      });
    }
    module.exports = baseOrderBy;
  }
});

// node_modules/lodash/sortBy.js
var require_sortBy = __commonJS({
  "node_modules/lodash/sortBy.js"(exports, module) {
    var baseFlatten = require_baseFlatten();
    var baseOrderBy = require_baseOrderBy();
    var baseRest = require_baseRest();
    var isIterateeCall = require_isIterateeCall();
    var sortBy = baseRest(function(collection, iteratees) {
      if (collection == null) {
        return [];
      }
      var length = iteratees.length;
      if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
        iteratees = [];
      } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
        iteratees = [iteratees[0]];
      }
      return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
    });
    module.exports = sortBy;
  }
});

// node_modules/lodash/_baseIsDate.js
var require_baseIsDate = __commonJS({
  "node_modules/lodash/_baseIsDate.js"(exports, module) {
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var dateTag = "[object Date]";
    function baseIsDate(value) {
      return isObjectLike(value) && baseGetTag(value) == dateTag;
    }
    module.exports = baseIsDate;
  }
});

// node_modules/lodash/isDate.js
var require_isDate = __commonJS({
  "node_modules/lodash/isDate.js"(exports, module) {
    var baseIsDate = require_baseIsDate();
    var baseUnary = require_baseUnary();
    var nodeUtil = require_nodeUtil();
    var nodeIsDate = nodeUtil && nodeUtil.isDate;
    var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;
    module.exports = isDate;
  }
});

// node_modules/@react-spring/rafz/dist/react-spring_rafz.modern.mjs
var updateQueue = makeQueue();
var raf = (fn3) => schedule(fn3, updateQueue);
var writeQueue = makeQueue();
raf.write = (fn3) => schedule(fn3, writeQueue);
var onStartQueue = makeQueue();
raf.onStart = (fn3) => schedule(fn3, onStartQueue);
var onFrameQueue = makeQueue();
raf.onFrame = (fn3) => schedule(fn3, onFrameQueue);
var onFinishQueue = makeQueue();
raf.onFinish = (fn3) => schedule(fn3, onFinishQueue);
var timeouts = [];
raf.setTimeout = (handler, ms) => {
  const time2 = raf.now() + ms;
  const cancel = () => {
    const i7 = timeouts.findIndex((t9) => t9.cancel == cancel);
    if (~i7) timeouts.splice(i7, 1);
    pendingCount -= ~i7 ? 1 : 0;
  };
  const timeout = { time: time2, handler, cancel };
  timeouts.splice(findTimeout(time2), 0, timeout);
  pendingCount += 1;
  start();
  return timeout;
};
var findTimeout = (time2) => ~(~timeouts.findIndex((t9) => t9.time > time2) || ~timeouts.length);
raf.cancel = (fn3) => {
  onStartQueue.delete(fn3);
  onFrameQueue.delete(fn3);
  onFinishQueue.delete(fn3);
  updateQueue.delete(fn3);
  writeQueue.delete(fn3);
};
raf.sync = (fn3) => {
  sync = true;
  raf.batchedUpdates(fn3);
  sync = false;
};
raf.throttle = (fn3) => {
  let lastArgs;
  function queuedFn() {
    try {
      fn3(...lastArgs);
    } finally {
      lastArgs = null;
    }
  }
  function throttled(...args) {
    lastArgs = args;
    raf.onStart(queuedFn);
  }
  throttled.handler = fn3;
  throttled.cancel = () => {
    onStartQueue.delete(queuedFn);
    lastArgs = null;
  };
  return throttled;
};
var nativeRaf = typeof window != "undefined" ? window.requestAnimationFrame : (
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  (() => {
  })
);
raf.use = (impl) => nativeRaf = impl;
raf.now = typeof performance != "undefined" ? () => performance.now() : Date.now;
raf.batchedUpdates = (fn3) => fn3();
raf.catch = console.error;
raf.frameLoop = "always";
raf.advance = () => {
  if (raf.frameLoop !== "demand") {
    console.warn(
      "Cannot call the manual advancement of rafz whilst frameLoop is not set as demand"
    );
  } else {
    update();
  }
};
var ts = -1;
var pendingCount = 0;
var sync = false;
function schedule(fn3, queue) {
  if (sync) {
    queue.delete(fn3);
    fn3(0);
  } else {
    queue.add(fn3);
    start();
  }
}
function start() {
  if (ts < 0) {
    ts = 0;
    if (raf.frameLoop !== "demand") {
      nativeRaf(loop);
    }
  }
}
function stop() {
  ts = -1;
}
function loop() {
  if (~ts) {
    nativeRaf(loop);
    raf.batchedUpdates(update);
  }
}
function update() {
  const prevTs = ts;
  ts = raf.now();
  const count2 = findTimeout(ts);
  if (count2) {
    eachSafely(timeouts.splice(0, count2), (t9) => t9.handler());
    pendingCount -= count2;
  }
  if (!pendingCount) {
    stop();
    return;
  }
  onStartQueue.flush();
  updateQueue.flush(prevTs ? Math.min(64, ts - prevTs) : 16.667);
  onFrameQueue.flush();
  writeQueue.flush();
  onFinishQueue.flush();
}
function makeQueue() {
  let next = /* @__PURE__ */ new Set();
  let current = next;
  return {
    add(fn3) {
      pendingCount += current == next && !next.has(fn3) ? 1 : 0;
      next.add(fn3);
    },
    delete(fn3) {
      pendingCount -= current == next && next.has(fn3) ? 1 : 0;
      return next.delete(fn3);
    },
    flush(arg) {
      if (current.size) {
        next = /* @__PURE__ */ new Set();
        pendingCount -= current.size;
        eachSafely(current, (fn3) => fn3(arg) && next.add(fn3));
        pendingCount += next.size;
        current = next;
      }
    }
  };
}
function eachSafely(values, each2) {
  values.forEach((value) => {
    try {
      each2(value);
    } catch (e11) {
      raf.catch(e11);
    }
  });
}

// node_modules/@react-spring/shared/dist/react-spring_shared.modern.mjs
var import_react = __toESM(require_react(), 1);
var import_react2 = __toESM(require_react(), 1);
var import_react3 = __toESM(require_react(), 1);
var import_react4 = __toESM(require_react(), 1);
var import_react5 = __toESM(require_react(), 1);
var import_react6 = __toESM(require_react(), 1);
var import_react7 = __toESM(require_react(), 1);
var import_react8 = __toESM(require_react(), 1);
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var globals_exports = {};
__export(globals_exports, {
  assign: () => assign,
  colors: () => colors,
  createStringInterpolator: () => createStringInterpolator,
  skipAnimation: () => skipAnimation,
  to: () => to,
  willAdvance: () => willAdvance
});
function noop() {
}
var defineHidden = (obj, key, value) => Object.defineProperty(obj, key, { value, writable: true, configurable: true });
var is = {
  arr: Array.isArray,
  obj: (a6) => !!a6 && a6.constructor.name === "Object",
  fun: (a6) => typeof a6 === "function",
  str: (a6) => typeof a6 === "string",
  num: (a6) => typeof a6 === "number",
  und: (a6) => a6 === void 0
};
function isEqual(a6, b6) {
  if (is.arr(a6)) {
    if (!is.arr(b6) || a6.length !== b6.length) return false;
    for (let i7 = 0; i7 < a6.length; i7++) {
      if (a6[i7] !== b6[i7]) return false;
    }
    return true;
  }
  return a6 === b6;
}
var each = (obj, fn3) => obj.forEach(fn3);
function eachProp(obj, fn3, ctx) {
  if (is.arr(obj)) {
    for (let i7 = 0; i7 < obj.length; i7++) {
      fn3.call(ctx, obj[i7], `${i7}`);
    }
    return;
  }
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      fn3.call(ctx, obj[key], key);
    }
  }
}
var toArray = (a6) => is.und(a6) ? [] : is.arr(a6) ? a6 : [a6];
function flush(queue, iterator) {
  if (queue.size) {
    const items = Array.from(queue);
    queue.clear();
    each(items, iterator);
  }
}
var flushCalls = (queue, ...args) => flush(queue, (fn3) => fn3(...args));
var isSSR = () => typeof window === "undefined" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent);
var createStringInterpolator;
var to;
var colors = null;
var skipAnimation = false;
var willAdvance = noop;
var assign = (globals) => {
  if (globals.to) to = globals.to;
  if (globals.now) raf.now = globals.now;
  if (globals.colors !== void 0) colors = globals.colors;
  if (globals.skipAnimation != null) skipAnimation = globals.skipAnimation;
  if (globals.createStringInterpolator)
    createStringInterpolator = globals.createStringInterpolator;
  if (globals.requestAnimationFrame) raf.use(globals.requestAnimationFrame);
  if (globals.batchedUpdates) raf.batchedUpdates = globals.batchedUpdates;
  if (globals.willAdvance) willAdvance = globals.willAdvance;
  if (globals.frameLoop) raf.frameLoop = globals.frameLoop;
};
var startQueue = /* @__PURE__ */ new Set();
var currentFrame = [];
var prevFrame = [];
var priority = 0;
var frameLoop = {
  get idle() {
    return !startQueue.size && !currentFrame.length;
  },
  /** Advance the given animation on every frame until idle. */
  start(animation) {
    if (priority > animation.priority) {
      startQueue.add(animation);
      raf.onStart(flushStartQueue);
    } else {
      startSafely(animation);
      raf(advance);
    }
  },
  /** Advance all animations by the given time. */
  advance,
  /** Call this when an animation's priority changes. */
  sort(animation) {
    if (priority) {
      raf.onFrame(() => frameLoop.sort(animation));
    } else {
      const prevIndex = currentFrame.indexOf(animation);
      if (~prevIndex) {
        currentFrame.splice(prevIndex, 1);
        startUnsafely(animation);
      }
    }
  },
  /**
   * Clear all animations. For testing purposes.
   *
   * ☠️ Never call this from within the frameloop.
   */
  clear() {
    currentFrame = [];
    startQueue.clear();
  }
};
function flushStartQueue() {
  startQueue.forEach(startSafely);
  startQueue.clear();
  raf(advance);
}
function startSafely(animation) {
  if (!currentFrame.includes(animation)) startUnsafely(animation);
}
function startUnsafely(animation) {
  currentFrame.splice(
    findIndex(currentFrame, (other) => other.priority > animation.priority),
    0,
    animation
  );
}
function advance(dt2) {
  const nextFrame = prevFrame;
  for (let i7 = 0; i7 < currentFrame.length; i7++) {
    const animation = currentFrame[i7];
    priority = animation.priority;
    if (!animation.idle) {
      willAdvance(animation);
      animation.advance(dt2);
      if (!animation.idle) {
        nextFrame.push(animation);
      }
    }
  }
  priority = 0;
  prevFrame = currentFrame;
  prevFrame.length = 0;
  currentFrame = nextFrame;
  return currentFrame.length > 0;
}
function findIndex(arr, test) {
  const index2 = arr.findIndex(test);
  return index2 < 0 ? arr.length : index2;
}
var clamp = (min3, max3, v3) => Math.min(Math.max(v3, min3), max3);
var colors2 = {
  transparent: 0,
  aliceblue: 4042850303,
  antiquewhite: 4209760255,
  aqua: 16777215,
  aquamarine: 2147472639,
  azure: 4043309055,
  beige: 4126530815,
  bisque: 4293182719,
  black: 255,
  blanchedalmond: 4293643775,
  blue: 65535,
  blueviolet: 2318131967,
  brown: 2771004159,
  burlywood: 3736635391,
  burntsienna: 3934150143,
  cadetblue: 1604231423,
  chartreuse: 2147418367,
  chocolate: 3530104575,
  coral: 4286533887,
  cornflowerblue: 1687547391,
  cornsilk: 4294499583,
  crimson: 3692313855,
  cyan: 16777215,
  darkblue: 35839,
  darkcyan: 9145343,
  darkgoldenrod: 3095792639,
  darkgray: 2846468607,
  darkgreen: 6553855,
  darkgrey: 2846468607,
  darkkhaki: 3182914559,
  darkmagenta: 2332068863,
  darkolivegreen: 1433087999,
  darkorange: 4287365375,
  darkorchid: 2570243327,
  darkred: 2332033279,
  darksalmon: 3918953215,
  darkseagreen: 2411499519,
  darkslateblue: 1211993087,
  darkslategray: 793726975,
  darkslategrey: 793726975,
  darkturquoise: 13554175,
  darkviolet: 2483082239,
  deeppink: 4279538687,
  deepskyblue: 12582911,
  dimgray: 1768516095,
  dimgrey: 1768516095,
  dodgerblue: 512819199,
  firebrick: 2988581631,
  floralwhite: 4294635775,
  forestgreen: 579543807,
  fuchsia: 4278255615,
  gainsboro: 3705462015,
  ghostwhite: 4177068031,
  gold: 4292280575,
  goldenrod: 3668254975,
  gray: 2155905279,
  green: 8388863,
  greenyellow: 2919182335,
  grey: 2155905279,
  honeydew: 4043305215,
  hotpink: 4285117695,
  indianred: 3445382399,
  indigo: 1258324735,
  ivory: 4294963455,
  khaki: 4041641215,
  lavender: 3873897215,
  lavenderblush: 4293981695,
  lawngreen: 2096890111,
  lemonchiffon: 4294626815,
  lightblue: 2916673279,
  lightcoral: 4034953471,
  lightcyan: 3774873599,
  lightgoldenrodyellow: 4210742015,
  lightgray: 3553874943,
  lightgreen: 2431553791,
  lightgrey: 3553874943,
  lightpink: 4290167295,
  lightsalmon: 4288707327,
  lightseagreen: 548580095,
  lightskyblue: 2278488831,
  lightslategray: 2005441023,
  lightslategrey: 2005441023,
  lightsteelblue: 2965692159,
  lightyellow: 4294959359,
  lime: 16711935,
  limegreen: 852308735,
  linen: 4210091775,
  magenta: 4278255615,
  maroon: 2147483903,
  mediumaquamarine: 1724754687,
  mediumblue: 52735,
  mediumorchid: 3126187007,
  mediumpurple: 2473647103,
  mediumseagreen: 1018393087,
  mediumslateblue: 2070474495,
  mediumspringgreen: 16423679,
  mediumturquoise: 1221709055,
  mediumvioletred: 3340076543,
  midnightblue: 421097727,
  mintcream: 4127193855,
  mistyrose: 4293190143,
  moccasin: 4293178879,
  navajowhite: 4292783615,
  navy: 33023,
  oldlace: 4260751103,
  olive: 2155872511,
  olivedrab: 1804477439,
  orange: 4289003775,
  orangered: 4282712319,
  orchid: 3664828159,
  palegoldenrod: 4008225535,
  palegreen: 2566625535,
  paleturquoise: 2951671551,
  palevioletred: 3681588223,
  papayawhip: 4293907967,
  peachpuff: 4292524543,
  peru: 3448061951,
  pink: 4290825215,
  plum: 3718307327,
  powderblue: 2967529215,
  purple: 2147516671,
  rebeccapurple: 1714657791,
  red: 4278190335,
  rosybrown: 3163525119,
  royalblue: 1097458175,
  saddlebrown: 2336560127,
  salmon: 4202722047,
  sandybrown: 4104413439,
  seagreen: 780883967,
  seashell: 4294307583,
  sienna: 2689740287,
  silver: 3233857791,
  skyblue: 2278484991,
  slateblue: 1784335871,
  slategray: 1887473919,
  slategrey: 1887473919,
  snow: 4294638335,
  springgreen: 16744447,
  steelblue: 1182971135,
  tan: 3535047935,
  teal: 8421631,
  thistle: 3636451583,
  tomato: 4284696575,
  turquoise: 1088475391,
  violet: 4001558271,
  wheat: 4125012991,
  white: 4294967295,
  whitesmoke: 4126537215,
  yellow: 4294902015,
  yellowgreen: 2597139199
};
var NUMBER = "[-+]?\\d*\\.?\\d+";
var PERCENTAGE = NUMBER + "%";
function call(...parts) {
  return "\\(\\s*(" + parts.join(")\\s*,\\s*(") + ")\\s*\\)";
}
var rgb = new RegExp("rgb" + call(NUMBER, NUMBER, NUMBER));
var rgba = new RegExp("rgba" + call(NUMBER, NUMBER, NUMBER, NUMBER));
var hsl = new RegExp("hsl" + call(NUMBER, PERCENTAGE, PERCENTAGE));
var hsla = new RegExp(
  "hsla" + call(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER)
);
var hex3 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;
var hex4 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;
var hex6 = /^#([0-9a-fA-F]{6})$/;
var hex8 = /^#([0-9a-fA-F]{8})$/;
function normalizeColor(color2) {
  let match;
  if (typeof color2 === "number") {
    return color2 >>> 0 === color2 && color2 >= 0 && color2 <= 4294967295 ? color2 : null;
  }
  if (match = hex6.exec(color2))
    return parseInt(match[1] + "ff", 16) >>> 0;
  if (colors && colors[color2] !== void 0) {
    return colors[color2];
  }
  if (match = rgb.exec(color2)) {
    return (parse255(match[1]) << 24 | // r
    parse255(match[2]) << 16 | // g
    parse255(match[3]) << 8 | // b
    255) >>> // a
    0;
  }
  if (match = rgba.exec(color2)) {
    return (parse255(match[1]) << 24 | // r
    parse255(match[2]) << 16 | // g
    parse255(match[3]) << 8 | // b
    parse1(match[4])) >>> // a
    0;
  }
  if (match = hex3.exec(color2)) {
    return parseInt(
      match[1] + match[1] + // r
      match[2] + match[2] + // g
      match[3] + match[3] + // b
      "ff",
      // a
      16
    ) >>> 0;
  }
  if (match = hex8.exec(color2)) return parseInt(match[1], 16) >>> 0;
  if (match = hex4.exec(color2)) {
    return parseInt(
      match[1] + match[1] + // r
      match[2] + match[2] + // g
      match[3] + match[3] + // b
      match[4] + match[4],
      // a
      16
    ) >>> 0;
  }
  if (match = hsl.exec(color2)) {
    return (hslToRgb(
      parse360(match[1]),
      // h
      parsePercentage(match[2]),
      // s
      parsePercentage(match[3])
      // l
    ) | 255) >>> // a
    0;
  }
  if (match = hsla.exec(color2)) {
    return (hslToRgb(
      parse360(match[1]),
      // h
      parsePercentage(match[2]),
      // s
      parsePercentage(match[3])
      // l
    ) | parse1(match[4])) >>> // a
    0;
  }
  return null;
}
function hue2rgb(p4, q2, t9) {
  if (t9 < 0) t9 += 1;
  if (t9 > 1) t9 -= 1;
  if (t9 < 1 / 6) return p4 + (q2 - p4) * 6 * t9;
  if (t9 < 1 / 2) return q2;
  if (t9 < 2 / 3) return p4 + (q2 - p4) * (2 / 3 - t9) * 6;
  return p4;
}
function hslToRgb(h2, s6, l5) {
  const q2 = l5 < 0.5 ? l5 * (1 + s6) : l5 + s6 - l5 * s6;
  const p4 = 2 * l5 - q2;
  const r7 = hue2rgb(p4, q2, h2 + 1 / 3);
  const g2 = hue2rgb(p4, q2, h2);
  const b6 = hue2rgb(p4, q2, h2 - 1 / 3);
  return Math.round(r7 * 255) << 24 | Math.round(g2 * 255) << 16 | Math.round(b6 * 255) << 8;
}
function parse255(str) {
  const int = parseInt(str, 10);
  if (int < 0) return 0;
  if (int > 255) return 255;
  return int;
}
function parse360(str) {
  const int = parseFloat(str);
  return (int % 360 + 360) % 360 / 360;
}
function parse1(str) {
  const num = parseFloat(str);
  if (num < 0) return 0;
  if (num > 1) return 255;
  return Math.round(num * 255);
}
function parsePercentage(str) {
  const int = parseFloat(str);
  if (int < 0) return 0;
  if (int > 100) return 1;
  return int / 100;
}
function colorToRgba(input) {
  let int32Color = normalizeColor(input);
  if (int32Color === null) return input;
  int32Color = int32Color || 0;
  const r7 = (int32Color & 4278190080) >>> 24;
  const g2 = (int32Color & 16711680) >>> 16;
  const b6 = (int32Color & 65280) >>> 8;
  const a6 = (int32Color & 255) / 255;
  return `rgba(${r7}, ${g2}, ${b6}, ${a6})`;
}
var createInterpolator = (range2, output, extrapolate) => {
  if (is.fun(range2)) {
    return range2;
  }
  if (is.arr(range2)) {
    return createInterpolator({
      range: range2,
      output,
      extrapolate
    });
  }
  if (is.str(range2.output[0])) {
    return createStringInterpolator(range2);
  }
  const config2 = range2;
  const outputRange = config2.output;
  const inputRange = config2.range || [0, 1];
  const extrapolateLeft = config2.extrapolateLeft || config2.extrapolate || "extend";
  const extrapolateRight = config2.extrapolateRight || config2.extrapolate || "extend";
  const easing = config2.easing || ((t9) => t9);
  return (input) => {
    const range22 = findRange(input, inputRange);
    return interpolate(
      input,
      inputRange[range22],
      inputRange[range22 + 1],
      outputRange[range22],
      outputRange[range22 + 1],
      easing,
      extrapolateLeft,
      extrapolateRight,
      config2.map
    );
  };
};
function interpolate(input, inputMin, inputMax, outputMin, outputMax, easing, extrapolateLeft, extrapolateRight, map4) {
  let result = map4 ? map4(input) : input;
  if (result < inputMin) {
    if (extrapolateLeft === "identity") return result;
    else if (extrapolateLeft === "clamp") result = inputMin;
  }
  if (result > inputMax) {
    if (extrapolateRight === "identity") return result;
    else if (extrapolateRight === "clamp") result = inputMax;
  }
  if (outputMin === outputMax) return outputMin;
  if (inputMin === inputMax) return input <= inputMin ? outputMin : outputMax;
  if (inputMin === -Infinity) result = -result;
  else if (inputMax === Infinity) result = result - inputMin;
  else result = (result - inputMin) / (inputMax - inputMin);
  result = easing(result);
  if (outputMin === -Infinity) result = -result;
  else if (outputMax === Infinity) result = result + outputMin;
  else result = result * (outputMax - outputMin) + outputMin;
  return result;
}
function findRange(input, inputRange) {
  for (var i7 = 1; i7 < inputRange.length - 1; ++i7)
    if (inputRange[i7] >= input) break;
  return i7 - 1;
}
var steps = (steps2, direction = "end") => (progress2) => {
  progress2 = direction === "end" ? Math.min(progress2, 0.999) : Math.max(progress2, 1e-3);
  const expanded = progress2 * steps2;
  const rounded = direction === "end" ? Math.floor(expanded) : Math.ceil(expanded);
  return clamp(0, 1, rounded / steps2);
};
var c1 = 1.70158;
var c2 = c1 * 1.525;
var c3 = c1 + 1;
var c4 = 2 * Math.PI / 3;
var c5 = 2 * Math.PI / 4.5;
var bounceOut = (x3) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x3 < 1 / d1) {
    return n1 * x3 * x3;
  } else if (x3 < 2 / d1) {
    return n1 * (x3 -= 1.5 / d1) * x3 + 0.75;
  } else if (x3 < 2.5 / d1) {
    return n1 * (x3 -= 2.25 / d1) * x3 + 0.9375;
  } else {
    return n1 * (x3 -= 2.625 / d1) * x3 + 0.984375;
  }
};
var easings = {
  linear: (x3) => x3,
  easeInQuad: (x3) => x3 * x3,
  easeOutQuad: (x3) => 1 - (1 - x3) * (1 - x3),
  easeInOutQuad: (x3) => x3 < 0.5 ? 2 * x3 * x3 : 1 - Math.pow(-2 * x3 + 2, 2) / 2,
  easeInCubic: (x3) => x3 * x3 * x3,
  easeOutCubic: (x3) => 1 - Math.pow(1 - x3, 3),
  easeInOutCubic: (x3) => x3 < 0.5 ? 4 * x3 * x3 * x3 : 1 - Math.pow(-2 * x3 + 2, 3) / 2,
  easeInQuart: (x3) => x3 * x3 * x3 * x3,
  easeOutQuart: (x3) => 1 - Math.pow(1 - x3, 4),
  easeInOutQuart: (x3) => x3 < 0.5 ? 8 * x3 * x3 * x3 * x3 : 1 - Math.pow(-2 * x3 + 2, 4) / 2,
  easeInQuint: (x3) => x3 * x3 * x3 * x3 * x3,
  easeOutQuint: (x3) => 1 - Math.pow(1 - x3, 5),
  easeInOutQuint: (x3) => x3 < 0.5 ? 16 * x3 * x3 * x3 * x3 * x3 : 1 - Math.pow(-2 * x3 + 2, 5) / 2,
  easeInSine: (x3) => 1 - Math.cos(x3 * Math.PI / 2),
  easeOutSine: (x3) => Math.sin(x3 * Math.PI / 2),
  easeInOutSine: (x3) => -(Math.cos(Math.PI * x3) - 1) / 2,
  easeInExpo: (x3) => x3 === 0 ? 0 : Math.pow(2, 10 * x3 - 10),
  easeOutExpo: (x3) => x3 === 1 ? 1 : 1 - Math.pow(2, -10 * x3),
  easeInOutExpo: (x3) => x3 === 0 ? 0 : x3 === 1 ? 1 : x3 < 0.5 ? Math.pow(2, 20 * x3 - 10) / 2 : (2 - Math.pow(2, -20 * x3 + 10)) / 2,
  easeInCirc: (x3) => 1 - Math.sqrt(1 - Math.pow(x3, 2)),
  easeOutCirc: (x3) => Math.sqrt(1 - Math.pow(x3 - 1, 2)),
  easeInOutCirc: (x3) => x3 < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x3, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x3 + 2, 2)) + 1) / 2,
  easeInBack: (x3) => c3 * x3 * x3 * x3 - c1 * x3 * x3,
  easeOutBack: (x3) => 1 + c3 * Math.pow(x3 - 1, 3) + c1 * Math.pow(x3 - 1, 2),
  easeInOutBack: (x3) => x3 < 0.5 ? Math.pow(2 * x3, 2) * ((c2 + 1) * 2 * x3 - c2) / 2 : (Math.pow(2 * x3 - 2, 2) * ((c2 + 1) * (x3 * 2 - 2) + c2) + 2) / 2,
  easeInElastic: (x3) => x3 === 0 ? 0 : x3 === 1 ? 1 : -Math.pow(2, 10 * x3 - 10) * Math.sin((x3 * 10 - 10.75) * c4),
  easeOutElastic: (x3) => x3 === 0 ? 0 : x3 === 1 ? 1 : Math.pow(2, -10 * x3) * Math.sin((x3 * 10 - 0.75) * c4) + 1,
  easeInOutElastic: (x3) => x3 === 0 ? 0 : x3 === 1 ? 1 : x3 < 0.5 ? -(Math.pow(2, 20 * x3 - 10) * Math.sin((20 * x3 - 11.125) * c5)) / 2 : Math.pow(2, -20 * x3 + 10) * Math.sin((20 * x3 - 11.125) * c5) / 2 + 1,
  easeInBounce: (x3) => 1 - bounceOut(1 - x3),
  easeOutBounce: bounceOut,
  easeInOutBounce: (x3) => x3 < 0.5 ? (1 - bounceOut(1 - 2 * x3)) / 2 : (1 + bounceOut(2 * x3 - 1)) / 2,
  steps
};
var $get = Symbol.for("FluidValue.get");
var $observers = Symbol.for("FluidValue.observers");
var hasFluidValue = (arg) => Boolean(arg && arg[$get]);
var getFluidValue = (arg) => arg && arg[$get] ? arg[$get]() : arg;
var getFluidObservers = (target) => target[$observers] || null;
function callFluidObserver(observer2, event) {
  if (observer2.eventObserved) {
    observer2.eventObserved(event);
  } else {
    observer2(event);
  }
}
function callFluidObservers(target, event) {
  const observers = target[$observers];
  if (observers) {
    observers.forEach((observer2) => {
      callFluidObserver(observer2, event);
    });
  }
}
var FluidValue = class {
  constructor(get) {
    if (!get && !(get = this.get)) {
      throw Error("Unknown getter");
    }
    setFluidGetter(this, get);
  }
};
var setFluidGetter = (target, get) => setHidden(target, $get, get);
function addFluidObserver(target, observer2) {
  if (target[$get]) {
    let observers = target[$observers];
    if (!observers) {
      setHidden(target, $observers, observers = /* @__PURE__ */ new Set());
    }
    if (!observers.has(observer2)) {
      observers.add(observer2);
      if (target.observerAdded) {
        target.observerAdded(observers.size, observer2);
      }
    }
  }
  return observer2;
}
function removeFluidObserver(target, observer2) {
  const observers = target[$observers];
  if (observers && observers.has(observer2)) {
    const count2 = observers.size - 1;
    if (count2) {
      observers.delete(observer2);
    } else {
      target[$observers] = null;
    }
    if (target.observerRemoved) {
      target.observerRemoved(count2, observer2);
    }
  }
}
var setHidden = (target, key, value) => Object.defineProperty(target, key, {
  value,
  writable: true,
  configurable: true
});
var numberRegex = /[+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
var colorRegex = /(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))/gi;
var unitRegex = new RegExp(`(${numberRegex.source})(%|[a-z]+)`, "i");
var rgbaRegex = /rgba\(([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+)\)/gi;
var cssVariableRegex = /var\((--[a-zA-Z0-9-_]+),? ?([a-zA-Z0-9 ()%#.,-]+)?\)/;
var variableToRgba = (input) => {
  const [token, fallback] = parseCSSVariable(input);
  if (!token || isSSR()) {
    return input;
  }
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(token);
  if (value) {
    return value.trim();
  } else if (fallback && fallback.startsWith("--")) {
    const value2 = window.getComputedStyle(document.documentElement).getPropertyValue(fallback);
    if (value2) {
      return value2;
    } else {
      return input;
    }
  } else if (fallback && cssVariableRegex.test(fallback)) {
    return variableToRgba(fallback);
  } else if (fallback) {
    return fallback;
  }
  return input;
};
var parseCSSVariable = (current) => {
  const match = cssVariableRegex.exec(current);
  if (!match) return [,];
  const [, token, fallback] = match;
  return [token, fallback];
};
var namedColorRegex;
var rgbaRound = (_3, p1, p22, p32, p4) => `rgba(${Math.round(p1)}, ${Math.round(p22)}, ${Math.round(p32)}, ${p4})`;
var createStringInterpolator2 = (config2) => {
  if (!namedColorRegex)
    namedColorRegex = colors ? (
      // match color names, ignore partial matches
      new RegExp(`(${Object.keys(colors).join("|")})(?!\\w)`, "g")
    ) : (
      // never match
      /^\b$/
    );
  const output = config2.output.map((value) => {
    return getFluidValue(value).replace(cssVariableRegex, variableToRgba).replace(colorRegex, colorToRgba).replace(namedColorRegex, colorToRgba);
  });
  const keyframes = output.map((value) => value.match(numberRegex).map(Number));
  const outputRanges = keyframes[0].map(
    (_3, i7) => keyframes.map((values) => {
      if (!(i7 in values)) {
        throw Error('The arity of each "output" value must be equal');
      }
      return values[i7];
    })
  );
  const interpolators = outputRanges.map(
    (output2) => createInterpolator({ ...config2, output: output2 })
  );
  return (input) => {
    const missingUnit = !unitRegex.test(output[0]) && output.find((value) => unitRegex.test(value))?.replace(numberRegex, "");
    let i7 = 0;
    return output[0].replace(
      numberRegex,
      () => `${interpolators[i7++](input)}${missingUnit || ""}`
    ).replace(rgbaRegex, rgbaRound);
  };
};
var prefix = "react-spring: ";
var once = (fn3) => {
  const func = fn3;
  let called = false;
  if (typeof func != "function") {
    throw new TypeError(`${prefix}once requires a function parameter`);
  }
  return (...args) => {
    if (!called) {
      func(...args);
      called = true;
    }
  };
};
var warnInterpolate = once(console.warn);
function deprecateInterpolate() {
  warnInterpolate(
    `${prefix}The "interpolate" function is deprecated in v9 (use "to" instead)`
  );
}
var warnDirectCall = once(console.warn);
function deprecateDirectCall() {
  warnDirectCall(
    `${prefix}Directly calling start instead of using the api object is deprecated in v9 (use ".start" instead), this will be removed in later 0.X.0 versions`
  );
}
function isAnimatedString(value) {
  return is.str(value) && (value[0] == "#" || /\d/.test(value) || // Do not identify a CSS variable as an AnimatedString if its SSR
  !isSSR() && cssVariableRegex.test(value) || value in (colors || {}));
}
var useIsomorphicLayoutEffect = isSSR() ? import_react4.useEffect : import_react4.useLayoutEffect;
var useIsMounted = () => {
  const isMounted = (0, import_react3.useRef)(false);
  useIsomorphicLayoutEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
};
function useForceUpdate() {
  const update3 = (0, import_react2.useState)()[1];
  const isMounted = useIsMounted();
  return () => {
    if (isMounted.current) {
      update3(Math.random());
    }
  };
}
var useOnce = (effect) => (0, import_react6.useEffect)(effect, emptyDeps);
var emptyDeps = [];
function usePrev(value) {
  const prevRef = (0, import_react7.useRef)(void 0);
  (0, import_react7.useEffect)(() => {
    prevRef.current = value;
  });
  return prevRef.current;
}

// node_modules/@react-spring/core/dist/react-spring_core.modern.mjs
var import_react10 = __toESM(require_react(), 1);

// node_modules/@react-spring/animated/dist/react-spring_animated.modern.mjs
var React = __toESM(require_react(), 1);
var import_react9 = __toESM(require_react(), 1);
var $node = Symbol.for("Animated:node");
var isAnimated = (value) => !!value && value[$node] === value;
var getAnimated = (owner) => owner && owner[$node];
var setAnimated = (owner, node) => defineHidden(owner, $node, node);
var getPayload = (owner) => owner && owner[$node] && owner[$node].getPayload();
var Animated = class {
  constructor() {
    setAnimated(this, this);
  }
  /** Get every `AnimatedValue` used by this node. */
  getPayload() {
    return this.payload || [];
  }
};
var AnimatedValue = class _AnimatedValue extends Animated {
  constructor(_value) {
    super();
    this._value = _value;
    this.done = true;
    this.durationProgress = 0;
    if (is.num(this._value)) {
      this.lastPosition = this._value;
    }
  }
  /** @internal */
  static create(value) {
    return new _AnimatedValue(value);
  }
  getPayload() {
    return [this];
  }
  getValue() {
    return this._value;
  }
  setValue(value, step) {
    if (is.num(value)) {
      this.lastPosition = value;
      if (step) {
        value = Math.round(value / step) * step;
        if (this.done) {
          this.lastPosition = value;
        }
      }
    }
    if (this._value === value) {
      return false;
    }
    this._value = value;
    return true;
  }
  reset() {
    const { done } = this;
    this.done = false;
    if (is.num(this._value)) {
      this.elapsedTime = 0;
      this.durationProgress = 0;
      this.lastPosition = this._value;
      if (done) this.lastVelocity = null;
      this.v0 = null;
    }
  }
};
var AnimatedString = class _AnimatedString extends AnimatedValue {
  constructor(value) {
    super(0);
    this._string = null;
    this._toString = createInterpolator({
      output: [value, value]
    });
  }
  /** @internal */
  static create(value) {
    return new _AnimatedString(value);
  }
  getValue() {
    const value = this._string;
    return value == null ? this._string = this._toString(this._value) : value;
  }
  setValue(value) {
    if (is.str(value)) {
      if (value == this._string) {
        return false;
      }
      this._string = value;
      this._value = 1;
    } else if (super.setValue(value)) {
      this._string = null;
    } else {
      return false;
    }
    return true;
  }
  reset(goal) {
    if (goal) {
      this._toString = createInterpolator({
        output: [this.getValue(), goal]
      });
    }
    this._value = 0;
    super.reset();
  }
};
var TreeContext = { dependencies: null };
var AnimatedObject = class extends Animated {
  constructor(source) {
    super();
    this.source = source;
    this.setValue(source);
  }
  getValue(animated2) {
    const values = {};
    eachProp(this.source, (source, key) => {
      if (isAnimated(source)) {
        values[key] = source.getValue(animated2);
      } else if (hasFluidValue(source)) {
        values[key] = getFluidValue(source);
      } else if (!animated2) {
        values[key] = source;
      }
    });
    return values;
  }
  /** Replace the raw object data */
  setValue(source) {
    this.source = source;
    this.payload = this._makePayload(source);
  }
  reset() {
    if (this.payload) {
      each(this.payload, (node) => node.reset());
    }
  }
  /** Create a payload set. */
  _makePayload(source) {
    if (source) {
      const payload = /* @__PURE__ */ new Set();
      eachProp(source, this._addToPayload, payload);
      return Array.from(payload);
    }
  }
  /** Add to a payload set. */
  _addToPayload(source) {
    if (TreeContext.dependencies && hasFluidValue(source)) {
      TreeContext.dependencies.add(source);
    }
    const payload = getPayload(source);
    if (payload) {
      each(payload, (node) => this.add(node));
    }
  }
};
var AnimatedArray = class _AnimatedArray extends AnimatedObject {
  constructor(source) {
    super(source);
  }
  /** @internal */
  static create(source) {
    return new _AnimatedArray(source);
  }
  getValue() {
    return this.source.map((node) => node.getValue());
  }
  setValue(source) {
    const payload = this.getPayload();
    if (source.length == payload.length) {
      return payload.map((node, i7) => node.setValue(source[i7])).some(Boolean);
    }
    super.setValue(source.map(makeAnimated));
    return true;
  }
};
function makeAnimated(value) {
  const nodeType = isAnimatedString(value) ? AnimatedString : AnimatedValue;
  return nodeType.create(value);
}
function getAnimatedType(value) {
  const parentNode = getAnimated(value);
  return parentNode ? parentNode.constructor : is.arr(value) ? AnimatedArray : isAnimatedString(value) ? AnimatedString : AnimatedValue;
}
var withAnimated = (Component2, host2) => {
  const hasInstance = (
    // Function components must use "forwardRef" to avoid being
    // re-rendered on every animation frame.
    !is.fun(Component2) || Component2.prototype && Component2.prototype.isReactComponent
  );
  return (0, import_react9.forwardRef)((givenProps, givenRef) => {
    const instanceRef = (0, import_react9.useRef)(null);
    const ref = hasInstance && // eslint-disable-next-line react-hooks/rules-of-hooks
    (0, import_react9.useCallback)(
      (value) => {
        instanceRef.current = updateRef(givenRef, value);
      },
      [givenRef]
    );
    const [props, deps] = getAnimatedState(givenProps, host2);
    const forceUpdate = useForceUpdate();
    const callback = () => {
      const instance = instanceRef.current;
      if (hasInstance && !instance) {
        return;
      }
      const didUpdate = instance ? host2.applyAnimatedValues(instance, props.getValue(true)) : false;
      if (didUpdate === false) {
        forceUpdate();
      }
    };
    const observer = new PropsObserver(callback, deps);
    const observerRef = (0, import_react9.useRef)(void 0);
    useIsomorphicLayoutEffect(() => {
      observerRef.current = observer;
      each(deps, (dep) => addFluidObserver(dep, observer));
      return () => {
        if (observerRef.current) {
          each(
            observerRef.current.deps,
            (dep) => removeFluidObserver(dep, observerRef.current)
          );
          raf.cancel(observerRef.current.update);
        }
      };
    });
    (0, import_react9.useEffect)(callback, []);
    useOnce(() => () => {
      const observer2 = observerRef.current;
      each(observer2.deps, (dep) => removeFluidObserver(dep, observer2));
    });
    const usedProps = host2.getComponentProps(props.getValue());
    return React.createElement(Component2, { ...usedProps, ref });
  });
};
var PropsObserver = class {
  constructor(update3, deps) {
    this.update = update3;
    this.deps = deps;
  }
  eventObserved(event) {
    if (event.type == "change") {
      raf.write(this.update);
    }
  }
};
function getAnimatedState(props, host2) {
  const dependencies = /* @__PURE__ */ new Set();
  TreeContext.dependencies = dependencies;
  if (props.style)
    props = {
      ...props,
      style: host2.createAnimatedStyle(props.style)
    };
  props = new AnimatedObject(props);
  TreeContext.dependencies = null;
  return [props, dependencies];
}
function updateRef(ref, value) {
  if (ref) {
    if (is.fun(ref)) ref(value);
    else ref.current = value;
  }
  return value;
}
var cacheKey = Symbol.for("AnimatedComponent");
var createHost = (components, {
  applyAnimatedValues: applyAnimatedValues2 = () => false,
  createAnimatedStyle = (style) => new AnimatedObject(style),
  getComponentProps = (props) => props
} = {}) => {
  const hostConfig = {
    applyAnimatedValues: applyAnimatedValues2,
    createAnimatedStyle,
    getComponentProps
  };
  const animated2 = (Component2) => {
    const displayName = getDisplayName(Component2) || "Anonymous";
    if (is.str(Component2)) {
      Component2 = animated2[Component2] || (animated2[Component2] = withAnimated(Component2, hostConfig));
    } else {
      Component2 = Component2[cacheKey] || (Component2[cacheKey] = withAnimated(Component2, hostConfig));
    }
    Component2.displayName = `Animated(${displayName})`;
    return Component2;
  };
  eachProp(components, (Component2, key) => {
    if (is.arr(components)) {
      key = getDisplayName(Component2);
    }
    animated2[key] = animated2(Component2);
  });
  return {
    animated: animated2
  };
};
var getDisplayName = (arg) => is.str(arg) ? arg : arg && is.str(arg.displayName) ? arg.displayName : is.fun(arg) && arg.name || null;

// node_modules/@react-spring/core/dist/react-spring_core.modern.mjs
var React2 = __toESM(require_react(), 1);
var import_react11 = __toESM(require_react(), 1);
var import_react12 = __toESM(require_react(), 1);
var React22 = __toESM(require_react(), 1);
var import_react13 = __toESM(require_react(), 1);
var import_react14 = __toESM(require_react(), 1);
function callProp(value, ...args) {
  return is.fun(value) ? value(...args) : value;
}
var matchProp = (value, key) => value === true || !!(key && value && (is.fun(value) ? value(key) : toArray(value).includes(key)));
var resolveProp = (prop, key) => is.obj(prop) ? key && prop[key] : prop;
var getDefaultProp = (props, key) => props.default === true ? props[key] : props.default ? props.default[key] : void 0;
var noopTransform = (value) => value;
var getDefaultProps = (props, transform = noopTransform) => {
  let keys = DEFAULT_PROPS;
  if (props.default && props.default !== true) {
    props = props.default;
    keys = Object.keys(props);
  }
  const defaults2 = {};
  for (const key of keys) {
    const value = transform(props[key], key);
    if (!is.und(value)) {
      defaults2[key] = value;
    }
  }
  return defaults2;
};
var DEFAULT_PROPS = [
  "config",
  "onProps",
  "onStart",
  "onChange",
  "onPause",
  "onResume",
  "onRest"
];
var RESERVED_PROPS = {
  config: 1,
  from: 1,
  to: 1,
  ref: 1,
  loop: 1,
  reset: 1,
  pause: 1,
  cancel: 1,
  reverse: 1,
  immediate: 1,
  default: 1,
  delay: 1,
  onProps: 1,
  onStart: 1,
  onChange: 1,
  onPause: 1,
  onResume: 1,
  onRest: 1,
  onResolve: 1,
  // Transition props
  items: 1,
  trail: 1,
  sort: 1,
  expires: 1,
  initial: 1,
  enter: 1,
  update: 1,
  leave: 1,
  children: 1,
  onDestroyed: 1,
  // Internal props
  keys: 1,
  callId: 1,
  parentId: 1
};
function getForwardProps(props) {
  const forward = {};
  let count2 = 0;
  eachProp(props, (value, prop) => {
    if (!RESERVED_PROPS[prop]) {
      forward[prop] = value;
      count2++;
    }
  });
  if (count2) {
    return forward;
  }
}
function inferTo(props) {
  const to22 = getForwardProps(props);
  if (to22) {
    const out = { to: to22 };
    eachProp(props, (val, key) => key in to22 || (out[key] = val));
    return out;
  }
  return { ...props };
}
function computeGoal(value) {
  value = getFluidValue(value);
  return is.arr(value) ? value.map(computeGoal) : isAnimatedString(value) ? globals_exports.createStringInterpolator({
    range: [0, 1],
    output: [value, value]
  })(1) : value;
}
function hasProps(props) {
  for (const _3 in props) return true;
  return false;
}
function isAsyncTo(to22) {
  return is.fun(to22) || is.arr(to22) && is.obj(to22[0]);
}
function detachRefs(ctrl, ref) {
  ctrl.ref?.delete(ctrl);
  ref?.delete(ctrl);
}
function replaceRef(ctrl, ref) {
  if (ref && ctrl.ref !== ref) {
    ctrl.ref?.delete(ctrl);
    ref.add(ctrl);
    ctrl.ref = ref;
  }
}
var config = {
  default: { tension: 170, friction: 26 },
  gentle: { tension: 120, friction: 14 },
  wobbly: { tension: 180, friction: 12 },
  stiff: { tension: 210, friction: 20 },
  slow: { tension: 280, friction: 60 },
  molasses: { tension: 280, friction: 120 }
};
var defaults = {
  ...config.default,
  mass: 1,
  damping: 1,
  easing: easings.linear,
  clamp: false
};
var AnimationConfig = class {
  constructor() {
    this.velocity = 0;
    Object.assign(this, defaults);
  }
};
function mergeConfig(config2, newConfig, defaultConfig) {
  if (defaultConfig) {
    defaultConfig = { ...defaultConfig };
    sanitizeConfig(defaultConfig, newConfig);
    newConfig = { ...defaultConfig, ...newConfig };
  }
  sanitizeConfig(config2, newConfig);
  Object.assign(config2, newConfig);
  for (const key in defaults) {
    if (config2[key] == null) {
      config2[key] = defaults[key];
    }
  }
  let { frequency, damping } = config2;
  const { mass } = config2;
  if (!is.und(frequency)) {
    if (frequency < 0.01) frequency = 0.01;
    if (damping < 0) damping = 0;
    config2.tension = Math.pow(2 * Math.PI / frequency, 2) * mass;
    config2.friction = 4 * Math.PI * damping * mass / frequency;
  }
  return config2;
}
function sanitizeConfig(config2, props) {
  if (!is.und(props.decay)) {
    config2.duration = void 0;
  } else {
    const isTensionConfig = !is.und(props.tension) || !is.und(props.friction);
    if (isTensionConfig || !is.und(props.frequency) || !is.und(props.damping) || !is.und(props.mass)) {
      config2.duration = void 0;
      config2.decay = void 0;
    }
    if (isTensionConfig) {
      config2.frequency = void 0;
    }
  }
}
var emptyArray = [];
var Animation = class {
  constructor() {
    this.changed = false;
    this.values = emptyArray;
    this.toValues = null;
    this.fromValues = emptyArray;
    this.config = new AnimationConfig();
    this.immediate = false;
  }
};
function scheduleProps(callId, { key, props, defaultProps, state, actions }) {
  return new Promise((resolve, reject) => {
    let delay;
    let timeout;
    let cancel = matchProp(props.cancel ?? defaultProps?.cancel, key);
    if (cancel) {
      onStart();
    } else {
      if (!is.und(props.pause)) {
        state.paused = matchProp(props.pause, key);
      }
      let pause = defaultProps?.pause;
      if (pause !== true) {
        pause = state.paused || matchProp(pause, key);
      }
      delay = callProp(props.delay || 0, key);
      if (pause) {
        state.resumeQueue.add(onResume);
        actions.pause();
      } else {
        actions.resume();
        onResume();
      }
    }
    function onPause() {
      state.resumeQueue.add(onResume);
      state.timeouts.delete(timeout);
      timeout.cancel();
      delay = timeout.time - raf.now();
    }
    function onResume() {
      if (delay > 0 && !globals_exports.skipAnimation) {
        state.delayed = true;
        timeout = raf.setTimeout(onStart, delay);
        state.pauseQueue.add(onPause);
        state.timeouts.add(timeout);
      } else {
        onStart();
      }
    }
    function onStart() {
      if (state.delayed) {
        state.delayed = false;
      }
      state.pauseQueue.delete(onPause);
      state.timeouts.delete(timeout);
      if (callId <= (state.cancelId || 0)) {
        cancel = true;
      }
      try {
        actions.start({ ...props, callId, cancel }, resolve);
      } catch (err) {
        reject(err);
      }
    }
  });
}
var getCombinedResult = (target, results) => results.length == 1 ? results[0] : results.some((result) => result.cancelled) ? getCancelledResult(target.get()) : results.every((result) => result.noop) ? getNoopResult(target.get()) : getFinishedResult(
  target.get(),
  results.every((result) => result.finished)
);
var getNoopResult = (value) => ({
  value,
  noop: true,
  finished: true,
  cancelled: false
});
var getFinishedResult = (value, finished, cancelled = false) => ({
  value,
  finished,
  cancelled
});
var getCancelledResult = (value) => ({
  value,
  cancelled: true,
  finished: false
});
function runAsync(to22, props, state, target) {
  const { callId, parentId, onRest } = props;
  const { asyncTo: prevTo, promise: prevPromise } = state;
  if (!parentId && to22 === prevTo && !props.reset) {
    return prevPromise;
  }
  return state.promise = (async () => {
    state.asyncId = callId;
    state.asyncTo = to22;
    const defaultProps = getDefaultProps(
      props,
      (value, key) => (
        // The `onRest` prop is only called when the `runAsync` promise is resolved.
        key === "onRest" ? void 0 : value
      )
    );
    let preventBail;
    let bail;
    const bailPromise = new Promise(
      (resolve, reject) => (preventBail = resolve, bail = reject)
    );
    const bailIfEnded = (bailSignal) => {
      const bailResult = (
        // The `cancel` prop or `stop` method was used.
        callId <= (state.cancelId || 0) && getCancelledResult(target) || // The async `to` prop was replaced.
        callId !== state.asyncId && getFinishedResult(target, false)
      );
      if (bailResult) {
        bailSignal.result = bailResult;
        bail(bailSignal);
        throw bailSignal;
      }
    };
    const animate = (arg1, arg2) => {
      const bailSignal = new BailSignal();
      const skipAnimationSignal = new SkipAnimationSignal();
      return (async () => {
        if (globals_exports.skipAnimation) {
          stopAsync(state);
          skipAnimationSignal.result = getFinishedResult(target, false);
          bail(skipAnimationSignal);
          throw skipAnimationSignal;
        }
        bailIfEnded(bailSignal);
        const props2 = is.obj(arg1) ? { ...arg1 } : { ...arg2, to: arg1 };
        props2.parentId = callId;
        eachProp(defaultProps, (value, key) => {
          if (is.und(props2[key])) {
            props2[key] = value;
          }
        });
        const result2 = await target.start(props2);
        bailIfEnded(bailSignal);
        if (state.paused) {
          await new Promise((resume) => {
            state.resumeQueue.add(resume);
          });
        }
        return result2;
      })();
    };
    let result;
    if (globals_exports.skipAnimation) {
      stopAsync(state);
      return getFinishedResult(target, false);
    }
    try {
      let animating;
      if (is.arr(to22)) {
        animating = (async (queue) => {
          for (const props2 of queue) {
            await animate(props2);
          }
        })(to22);
      } else {
        animating = Promise.resolve(to22(animate, target.stop.bind(target)));
      }
      await Promise.all([animating.then(preventBail), bailPromise]);
      result = getFinishedResult(target.get(), true, false);
    } catch (err) {
      if (err instanceof BailSignal) {
        result = err.result;
      } else if (err instanceof SkipAnimationSignal) {
        result = err.result;
      } else {
        throw err;
      }
    } finally {
      if (callId == state.asyncId) {
        state.asyncId = parentId;
        state.asyncTo = parentId ? prevTo : void 0;
        state.promise = parentId ? prevPromise : void 0;
      }
    }
    if (is.fun(onRest)) {
      raf.batchedUpdates(() => {
        onRest(result, target, target.item);
      });
    }
    return result;
  })();
}
function stopAsync(state, cancelId) {
  flush(state.timeouts, (t9) => t9.cancel());
  state.pauseQueue.clear();
  state.resumeQueue.clear();
  state.asyncId = state.asyncTo = state.promise = void 0;
  if (cancelId) state.cancelId = cancelId;
}
var BailSignal = class extends Error {
  constructor() {
    super(
      "An async animation has been interrupted. You see this error because you forgot to use `await` or `.catch(...)` on its returned promise."
    );
  }
};
var SkipAnimationSignal = class extends Error {
  constructor() {
    super("SkipAnimationSignal");
  }
};
var isFrameValue = (value) => value instanceof FrameValue;
var nextId = 1;
var FrameValue = class extends FluidValue {
  constructor() {
    super(...arguments);
    this.id = nextId++;
    this._priority = 0;
  }
  get priority() {
    return this._priority;
  }
  set priority(priority2) {
    if (this._priority != priority2) {
      this._priority = priority2;
      this._onPriorityChange(priority2);
    }
  }
  /** Get the current value */
  get() {
    const node = getAnimated(this);
    return node && node.getValue();
  }
  /** Create a spring that maps our value to another value */
  to(...args) {
    return globals_exports.to(this, args);
  }
  /** @deprecated Use the `to` method instead. */
  interpolate(...args) {
    deprecateInterpolate();
    return globals_exports.to(this, args);
  }
  toJSON() {
    return this.get();
  }
  observerAdded(count2) {
    if (count2 == 1) this._attach();
  }
  observerRemoved(count2) {
    if (count2 == 0) this._detach();
  }
  /** Called when the first child is added. */
  _attach() {
  }
  /** Called when the last child is removed. */
  _detach() {
  }
  /** Tell our children about our new value */
  _onChange(value, idle = false) {
    callFluidObservers(this, {
      type: "change",
      parent: this,
      value,
      idle
    });
  }
  /** Tell our children about our new priority */
  _onPriorityChange(priority2) {
    if (!this.idle) {
      frameLoop.sort(this);
    }
    callFluidObservers(this, {
      type: "priority",
      parent: this,
      priority: priority2
    });
  }
};
var $P = Symbol.for("SpringPhase");
var HAS_ANIMATED = 1;
var IS_ANIMATING = 2;
var IS_PAUSED = 4;
var hasAnimated = (target) => (target[$P] & HAS_ANIMATED) > 0;
var isAnimating = (target) => (target[$P] & IS_ANIMATING) > 0;
var isPaused = (target) => (target[$P] & IS_PAUSED) > 0;
var setActiveBit = (target, active) => active ? target[$P] |= IS_ANIMATING | HAS_ANIMATED : target[$P] &= ~IS_ANIMATING;
var setPausedBit = (target, paused) => paused ? target[$P] |= IS_PAUSED : target[$P] &= ~IS_PAUSED;
var SpringValue = class extends FrameValue {
  constructor(arg1, arg2) {
    super();
    this.animation = new Animation();
    this.defaultProps = {};
    this._state = {
      paused: false,
      delayed: false,
      pauseQueue: /* @__PURE__ */ new Set(),
      resumeQueue: /* @__PURE__ */ new Set(),
      timeouts: /* @__PURE__ */ new Set()
    };
    this._pendingCalls = /* @__PURE__ */ new Set();
    this._lastCallId = 0;
    this._lastToId = 0;
    this._memoizedDuration = 0;
    if (!is.und(arg1) || !is.und(arg2)) {
      const props = is.obj(arg1) ? { ...arg1 } : { ...arg2, from: arg1 };
      if (is.und(props.default)) {
        props.default = true;
      }
      this.start(props);
    }
  }
  /** Equals true when not advancing on each frame. */
  get idle() {
    return !(isAnimating(this) || this._state.asyncTo) || isPaused(this);
  }
  get goal() {
    return getFluidValue(this.animation.to);
  }
  get velocity() {
    const node = getAnimated(this);
    return node instanceof AnimatedValue ? node.lastVelocity || 0 : node.getPayload().map((node2) => node2.lastVelocity || 0);
  }
  /**
   * When true, this value has been animated at least once.
   */
  get hasAnimated() {
    return hasAnimated(this);
  }
  /**
   * When true, this value has an unfinished animation,
   * which is either active or paused.
   */
  get isAnimating() {
    return isAnimating(this);
  }
  /**
   * When true, all current and future animations are paused.
   */
  get isPaused() {
    return isPaused(this);
  }
  /**
   *
   *
   */
  get isDelayed() {
    return this._state.delayed;
  }
  /** Advance the current animation by a number of milliseconds */
  advance(dt2) {
    let idle = true;
    let changed = false;
    const anim = this.animation;
    let { toValues } = anim;
    const { config: config2 } = anim;
    const payload = getPayload(anim.to);
    if (!payload && hasFluidValue(anim.to)) {
      toValues = toArray(getFluidValue(anim.to));
    }
    anim.values.forEach((node2, i7) => {
      if (node2.done) return;
      const to22 = (
        // Animated strings always go from 0 to 1.
        node2.constructor == AnimatedString ? 1 : payload ? payload[i7].lastPosition : toValues[i7]
      );
      let finished = anim.immediate;
      let position = to22;
      if (!finished) {
        position = node2.lastPosition;
        if (config2.tension <= 0) {
          node2.done = true;
          return;
        }
        let elapsed = node2.elapsedTime += dt2;
        const from = anim.fromValues[i7];
        const v0 = node2.v0 != null ? node2.v0 : node2.v0 = is.arr(config2.velocity) ? config2.velocity[i7] : config2.velocity;
        let velocity;
        const precision = config2.precision || (from == to22 ? 5e-3 : Math.min(1, Math.abs(to22 - from) * 1e-3));
        if (!is.und(config2.duration)) {
          let p4 = 1;
          if (config2.duration > 0) {
            if (this._memoizedDuration !== config2.duration) {
              this._memoizedDuration = config2.duration;
              if (node2.durationProgress > 0) {
                node2.elapsedTime = config2.duration * node2.durationProgress;
                elapsed = node2.elapsedTime += dt2;
              }
            }
            p4 = (config2.progress || 0) + elapsed / this._memoizedDuration;
            p4 = p4 > 1 ? 1 : p4 < 0 ? 0 : p4;
            node2.durationProgress = p4;
          }
          position = from + config2.easing(p4) * (to22 - from);
          velocity = (position - node2.lastPosition) / dt2;
          finished = p4 == 1;
        } else if (config2.decay) {
          const decay = config2.decay === true ? 0.998 : config2.decay;
          const e11 = Math.exp(-(1 - decay) * elapsed);
          position = from + v0 / (1 - decay) * (1 - e11);
          finished = Math.abs(node2.lastPosition - position) <= precision;
          velocity = v0 * e11;
        } else {
          velocity = node2.lastVelocity == null ? v0 : node2.lastVelocity;
          const restVelocity = config2.restVelocity || precision / 10;
          const bounceFactor = config2.clamp ? 0 : config2.bounce;
          const canBounce = !is.und(bounceFactor);
          const isGrowing = from == to22 ? node2.v0 > 0 : from < to22;
          let isMoving;
          let isBouncing = false;
          const step = 1;
          const numSteps = Math.ceil(dt2 / step);
          for (let n8 = 0; n8 < numSteps; ++n8) {
            isMoving = Math.abs(velocity) > restVelocity;
            if (!isMoving) {
              finished = Math.abs(to22 - position) <= precision;
              if (finished) {
                break;
              }
            }
            if (canBounce) {
              isBouncing = position == to22 || position > to22 == isGrowing;
              if (isBouncing) {
                velocity = -velocity * bounceFactor;
                position = to22;
              }
            }
            const springForce = -config2.tension * 1e-6 * (position - to22);
            const dampingForce = -config2.friction * 1e-3 * velocity;
            const acceleration = (springForce + dampingForce) / config2.mass;
            velocity = velocity + acceleration * step;
            position = position + velocity * step;
          }
        }
        node2.lastVelocity = velocity;
        if (Number.isNaN(position)) {
          console.warn(`Got NaN while animating:`, this);
          finished = true;
        }
      }
      if (payload && !payload[i7].done) {
        finished = false;
      }
      if (finished) {
        node2.done = true;
      } else {
        idle = false;
      }
      if (node2.setValue(position, config2.round)) {
        changed = true;
      }
    });
    const node = getAnimated(this);
    const currVal = node.getValue();
    if (idle) {
      const finalVal = getFluidValue(anim.to);
      if ((currVal !== finalVal || changed) && !config2.decay) {
        node.setValue(finalVal);
        this._onChange(finalVal);
      } else if (changed && config2.decay) {
        this._onChange(currVal);
      }
      this._stop();
    } else if (changed) {
      this._onChange(currVal);
    }
  }
  /** Set the current value, while stopping the current animation */
  set(value) {
    raf.batchedUpdates(() => {
      this._stop();
      this._focus(value);
      this._set(value);
    });
    return this;
  }
  /**
   * Freeze the active animation in time, as well as any updates merged
   * before `resume` is called.
   */
  pause() {
    this._update({ pause: true });
  }
  /** Resume the animation if paused. */
  resume() {
    this._update({ pause: false });
  }
  /** Skip to the end of the current animation. */
  finish() {
    if (isAnimating(this)) {
      const { to: to22, config: config2 } = this.animation;
      raf.batchedUpdates(() => {
        this._onStart();
        if (!config2.decay) {
          this._set(to22, false);
        }
        this._stop();
      });
    }
    return this;
  }
  /** Push props into the pending queue. */
  update(props) {
    const queue = this.queue || (this.queue = []);
    queue.push(props);
    return this;
  }
  start(to22, arg2) {
    let queue;
    if (!is.und(to22)) {
      queue = [is.obj(to22) ? to22 : { ...arg2, to: to22 }];
    } else {
      queue = this.queue || [];
      this.queue = [];
    }
    return Promise.all(
      queue.map((props) => {
        const up = this._update(props);
        return up;
      })
    ).then((results) => getCombinedResult(this, results));
  }
  /**
   * Stop the current animation, and cancel any delayed updates.
   *
   * Pass `true` to call `onRest` with `cancelled: true`.
   */
  stop(cancel) {
    const { to: to22 } = this.animation;
    this._focus(this.get());
    stopAsync(this._state, cancel && this._lastCallId);
    raf.batchedUpdates(() => this._stop(to22, cancel));
    return this;
  }
  /** Restart the animation. */
  reset() {
    this._update({ reset: true });
  }
  /** @internal */
  eventObserved(event) {
    if (event.type == "change") {
      this._start();
    } else if (event.type == "priority") {
      this.priority = event.priority + 1;
    }
  }
  /**
   * Parse the `to` and `from` range from the given `props` object.
   *
   * This also ensures the initial value is available to animated components
   * during the render phase.
   */
  _prepareNode(props) {
    const key = this.key || "";
    let { to: to22, from } = props;
    to22 = is.obj(to22) ? to22[key] : to22;
    if (to22 == null || isAsyncTo(to22)) {
      to22 = void 0;
    }
    from = is.obj(from) ? from[key] : from;
    if (from == null) {
      from = void 0;
    }
    const range2 = { to: to22, from };
    if (!hasAnimated(this)) {
      if (props.reverse) [to22, from] = [from, to22];
      from = getFluidValue(from);
      if (!is.und(from)) {
        this._set(from);
      } else if (!getAnimated(this)) {
        this._set(to22);
      }
    }
    return range2;
  }
  /** Every update is processed by this method before merging. */
  _update({ ...props }, isLoop) {
    const { key, defaultProps } = this;
    if (props.default)
      Object.assign(
        defaultProps,
        getDefaultProps(
          props,
          (value, prop) => /^on/.test(prop) ? resolveProp(value, key) : value
        )
      );
    mergeActiveFn(this, props, "onProps");
    sendEvent(this, "onProps", props, this);
    const range2 = this._prepareNode(props);
    if (Object.isFrozen(this)) {
      throw Error(
        "Cannot animate a `SpringValue` object that is frozen. Did you forget to pass your component to `animated(...)` before animating its props?"
      );
    }
    const state = this._state;
    return scheduleProps(++this._lastCallId, {
      key,
      props,
      defaultProps,
      state,
      actions: {
        pause: () => {
          if (!isPaused(this)) {
            setPausedBit(this, true);
            flushCalls(state.pauseQueue);
            sendEvent(
              this,
              "onPause",
              getFinishedResult(this, checkFinished(this, this.animation.to)),
              this
            );
          }
        },
        resume: () => {
          if (isPaused(this)) {
            setPausedBit(this, false);
            if (isAnimating(this)) {
              this._resume();
            }
            flushCalls(state.resumeQueue);
            sendEvent(
              this,
              "onResume",
              getFinishedResult(this, checkFinished(this, this.animation.to)),
              this
            );
          }
        },
        start: this._merge.bind(this, range2)
      }
    }).then((result) => {
      if (props.loop && result.finished && !(isLoop && result.noop)) {
        const nextProps = createLoopUpdate(props);
        if (nextProps) {
          return this._update(nextProps, true);
        }
      }
      return result;
    });
  }
  /** Merge props into the current animation */
  _merge(range2, props, resolve) {
    if (props.cancel) {
      this.stop(true);
      return resolve(getCancelledResult(this));
    }
    const hasToProp = !is.und(range2.to);
    const hasFromProp = !is.und(range2.from);
    if (hasToProp || hasFromProp) {
      if (props.callId > this._lastToId) {
        this._lastToId = props.callId;
      } else {
        return resolve(getCancelledResult(this));
      }
    }
    const { key, defaultProps, animation: anim } = this;
    const { to: prevTo, from: prevFrom } = anim;
    let { to: to22 = prevTo, from = prevFrom } = range2;
    if (hasFromProp && !hasToProp && (!props.default || is.und(to22))) {
      to22 = from;
    }
    if (props.reverse) [to22, from] = [from, to22];
    const hasFromChanged = !isEqual(from, prevFrom);
    if (hasFromChanged) {
      anim.from = from;
    }
    from = getFluidValue(from);
    const hasToChanged = !isEqual(to22, prevTo);
    if (hasToChanged) {
      this._focus(to22);
    }
    const hasAsyncTo = isAsyncTo(props.to);
    const { config: config2 } = anim;
    const { decay, velocity } = config2;
    if (hasToProp || hasFromProp) {
      config2.velocity = 0;
    }
    if (props.config && !hasAsyncTo) {
      mergeConfig(
        config2,
        callProp(props.config, key),
        // Avoid calling the same "config" prop twice.
        props.config !== defaultProps.config ? callProp(defaultProps.config, key) : void 0
      );
    }
    let node = getAnimated(this);
    if (!node || is.und(to22)) {
      return resolve(getFinishedResult(this, true));
    }
    const reset = (
      // When `reset` is undefined, the `from` prop implies `reset: true`,
      // except for declarative updates. When `reset` is defined, there
      // must exist a value to animate from.
      is.und(props.reset) ? hasFromProp && !props.default : !is.und(from) && matchProp(props.reset, key)
    );
    const value = reset ? from : this.get();
    const goal = computeGoal(to22);
    const isAnimatable = is.num(goal) || is.arr(goal) || isAnimatedString(goal);
    const immediate = !hasAsyncTo && (!isAnimatable || matchProp(defaultProps.immediate || props.immediate, key));
    if (hasToChanged) {
      const nodeType = getAnimatedType(to22);
      if (nodeType !== node.constructor) {
        if (immediate) {
          node = this._set(goal);
        } else
          throw Error(
            `Cannot animate between ${node.constructor.name} and ${nodeType.name}, as the "to" prop suggests`
          );
      }
    }
    const goalType = node.constructor;
    let started = hasFluidValue(to22);
    let finished = false;
    if (!started) {
      const hasValueChanged = reset || !hasAnimated(this) && hasFromChanged;
      if (hasToChanged || hasValueChanged) {
        finished = isEqual(computeGoal(value), goal);
        started = !finished;
      }
      if (!isEqual(anim.immediate, immediate) && !immediate || !isEqual(config2.decay, decay) || !isEqual(config2.velocity, velocity)) {
        started = true;
      }
    }
    if (finished && isAnimating(this)) {
      if (anim.changed && !reset) {
        started = true;
      } else if (!started) {
        this._stop(prevTo);
      }
    }
    if (!hasAsyncTo) {
      if (started || hasFluidValue(prevTo)) {
        anim.values = node.getPayload();
        anim.toValues = hasFluidValue(to22) ? null : goalType == AnimatedString ? [1] : toArray(goal);
      }
      if (anim.immediate != immediate) {
        anim.immediate = immediate;
        if (!immediate && !reset) {
          this._set(prevTo);
        }
      }
      if (started) {
        const { onRest } = anim;
        each(ACTIVE_EVENTS, (type) => mergeActiveFn(this, props, type));
        const result = getFinishedResult(this, checkFinished(this, prevTo));
        flushCalls(this._pendingCalls, result);
        this._pendingCalls.add(resolve);
        if (anim.changed)
          raf.batchedUpdates(() => {
            anim.changed = !reset;
            onRest?.(result, this);
            if (reset) {
              callProp(defaultProps.onRest, result);
            } else {
              anim.onStart?.(result, this);
            }
          });
      }
    }
    if (reset) {
      this._set(value);
    }
    if (hasAsyncTo) {
      resolve(runAsync(props.to, props, this._state, this));
    } else if (started) {
      this._start();
    } else if (isAnimating(this) && !hasToChanged) {
      this._pendingCalls.add(resolve);
    } else {
      resolve(getNoopResult(value));
    }
  }
  /** Update the `animation.to` value, which might be a `FluidValue` */
  _focus(value) {
    const anim = this.animation;
    if (value !== anim.to) {
      if (getFluidObservers(this)) {
        this._detach();
      }
      anim.to = value;
      if (getFluidObservers(this)) {
        this._attach();
      }
    }
  }
  _attach() {
    let priority2 = 0;
    const { to: to22 } = this.animation;
    if (hasFluidValue(to22)) {
      addFluidObserver(to22, this);
      if (isFrameValue(to22)) {
        priority2 = to22.priority + 1;
      }
    }
    this.priority = priority2;
  }
  _detach() {
    const { to: to22 } = this.animation;
    if (hasFluidValue(to22)) {
      removeFluidObserver(to22, this);
    }
  }
  /**
   * Update the current value from outside the frameloop,
   * and return the `Animated` node.
   */
  _set(arg, idle = true) {
    const value = getFluidValue(arg);
    if (!is.und(value)) {
      const oldNode = getAnimated(this);
      if (!oldNode || !isEqual(value, oldNode.getValue())) {
        const nodeType = getAnimatedType(value);
        if (!oldNode || oldNode.constructor != nodeType) {
          setAnimated(this, nodeType.create(value));
        } else {
          oldNode.setValue(value);
        }
        if (oldNode) {
          raf.batchedUpdates(() => {
            this._onChange(value, idle);
          });
        }
      }
    }
    return getAnimated(this);
  }
  _onStart() {
    const anim = this.animation;
    if (!anim.changed) {
      anim.changed = true;
      sendEvent(
        this,
        "onStart",
        getFinishedResult(this, checkFinished(this, anim.to)),
        this
      );
    }
  }
  _onChange(value, idle) {
    if (!idle) {
      this._onStart();
      callProp(this.animation.onChange, value, this);
    }
    callProp(this.defaultProps.onChange, value, this);
    super._onChange(value, idle);
  }
  // This method resets the animation state (even if already animating) to
  // ensure the latest from/to range is used, and it also ensures this spring
  // is added to the frameloop.
  _start() {
    const anim = this.animation;
    getAnimated(this).reset(getFluidValue(anim.to));
    if (!anim.immediate) {
      anim.fromValues = anim.values.map((node) => node.lastPosition);
    }
    if (!isAnimating(this)) {
      setActiveBit(this, true);
      if (!isPaused(this)) {
        this._resume();
      }
    }
  }
  _resume() {
    if (globals_exports.skipAnimation) {
      this.finish();
    } else {
      frameLoop.start(this);
    }
  }
  /**
   * Exit the frameloop and notify `onRest` listeners.
   *
   * Always wrap `_stop` calls with `batchedUpdates`.
   */
  _stop(goal, cancel) {
    if (isAnimating(this)) {
      setActiveBit(this, false);
      const anim = this.animation;
      each(anim.values, (node) => {
        node.done = true;
      });
      if (anim.toValues) {
        anim.onChange = anim.onPause = anim.onResume = void 0;
      }
      callFluidObservers(this, {
        type: "idle",
        parent: this
      });
      const result = cancel ? getCancelledResult(this.get()) : getFinishedResult(this.get(), checkFinished(this, goal ?? anim.to));
      flushCalls(this._pendingCalls, result);
      if (anim.changed) {
        anim.changed = false;
        sendEvent(this, "onRest", result, this);
      }
    }
  }
};
function checkFinished(target, to22) {
  const goal = computeGoal(to22);
  const value = computeGoal(target.get());
  return isEqual(value, goal);
}
function createLoopUpdate(props, loop2 = props.loop, to22 = props.to) {
  const loopRet = callProp(loop2);
  if (loopRet) {
    const overrides = loopRet !== true && inferTo(loopRet);
    const reverse2 = (overrides || props).reverse;
    const reset = !overrides || overrides.reset;
    return createUpdate({
      ...props,
      loop: loop2,
      // Avoid updating default props when looping.
      default: false,
      // Never loop the `pause` prop.
      pause: void 0,
      // For the "reverse" prop to loop as expected, the "to" prop
      // must be undefined. The "reverse" prop is ignored when the
      // "to" prop is an array or function.
      to: !reverse2 || isAsyncTo(to22) ? to22 : void 0,
      // Ignore the "from" prop except on reset.
      from: reset ? props.from : void 0,
      reset,
      // The "loop" prop can return a "useSpring" props object to
      // override any of the original props.
      ...overrides
    });
  }
}
function createUpdate(props) {
  const { to: to22, from } = props = inferTo(props);
  const keys = /* @__PURE__ */ new Set();
  if (is.obj(to22)) findDefined(to22, keys);
  if (is.obj(from)) findDefined(from, keys);
  props.keys = keys.size ? Array.from(keys) : null;
  return props;
}
function declareUpdate(props) {
  const update22 = createUpdate(props);
  if (is.und(update22.default)) {
    update22.default = getDefaultProps(update22);
  }
  return update22;
}
function findDefined(values, keys) {
  eachProp(values, (value, key) => value != null && keys.add(key));
}
var ACTIVE_EVENTS = [
  "onStart",
  "onRest",
  "onChange",
  "onPause",
  "onResume"
];
function mergeActiveFn(target, props, type) {
  target.animation[type] = props[type] !== getDefaultProp(props, type) ? resolveProp(props[type], target.key) : void 0;
}
function sendEvent(target, type, ...args) {
  target.animation[type]?.(...args);
  target.defaultProps[type]?.(...args);
}
var BATCHED_EVENTS = ["onStart", "onChange", "onRest"];
var nextId2 = 1;
var Controller = class {
  constructor(props, flush3) {
    this.id = nextId2++;
    this.springs = {};
    this.queue = [];
    this._lastAsyncId = 0;
    this._active = /* @__PURE__ */ new Set();
    this._changed = /* @__PURE__ */ new Set();
    this._started = false;
    this._state = {
      paused: false,
      pauseQueue: /* @__PURE__ */ new Set(),
      resumeQueue: /* @__PURE__ */ new Set(),
      timeouts: /* @__PURE__ */ new Set()
    };
    this._events = {
      onStart: /* @__PURE__ */ new Map(),
      onChange: /* @__PURE__ */ new Map(),
      onRest: /* @__PURE__ */ new Map()
    };
    this._onFrame = this._onFrame.bind(this);
    if (flush3) {
      this._flush = flush3;
    }
    if (props) {
      this.start({ default: true, ...props });
    }
  }
  /**
   * Equals `true` when no spring values are in the frameloop, and
   * no async animation is currently active.
   */
  get idle() {
    return !this._state.asyncTo && Object.values(this.springs).every((spring) => {
      return spring.idle && !spring.isDelayed && !spring.isPaused;
    });
  }
  get item() {
    return this._item;
  }
  set item(item) {
    this._item = item;
  }
  /** Get the current values of our springs */
  get() {
    const values = {};
    this.each((spring, key) => values[key] = spring.get());
    return values;
  }
  /** Set the current values without animating. */
  set(values) {
    for (const key in values) {
      const value = values[key];
      if (!is.und(value)) {
        this.springs[key].set(value);
      }
    }
  }
  /** Push an update onto the queue of each value. */
  update(props) {
    if (props) {
      this.queue.push(createUpdate(props));
    }
    return this;
  }
  /**
   * Start the queued animations for every spring, and resolve the returned
   * promise once all queued animations have finished or been cancelled.
   *
   * When you pass a queue (instead of nothing), that queue is used instead of
   * the queued animations added with the `update` method, which are left alone.
   */
  start(props) {
    let { queue } = this;
    if (props) {
      queue = toArray(props).map(createUpdate);
    } else {
      this.queue = [];
    }
    if (this._flush) {
      return this._flush(this, queue);
    }
    prepareKeys(this, queue);
    return flushUpdateQueue(this, queue);
  }
  /** @internal */
  stop(arg, keys) {
    if (arg !== !!arg) {
      keys = arg;
    }
    if (keys) {
      const springs = this.springs;
      each(toArray(keys), (key) => springs[key].stop(!!arg));
    } else {
      stopAsync(this._state, this._lastAsyncId);
      this.each((spring) => spring.stop(!!arg));
    }
    return this;
  }
  /** Freeze the active animation in time */
  pause(keys) {
    if (is.und(keys)) {
      this.start({ pause: true });
    } else {
      const springs = this.springs;
      each(toArray(keys), (key) => springs[key].pause());
    }
    return this;
  }
  /** Resume the animation if paused. */
  resume(keys) {
    if (is.und(keys)) {
      this.start({ pause: false });
    } else {
      const springs = this.springs;
      each(toArray(keys), (key) => springs[key].resume());
    }
    return this;
  }
  /** Call a function once per spring value */
  each(iterator) {
    eachProp(this.springs, iterator);
  }
  /** @internal Called at the end of every animation frame */
  _onFrame() {
    const { onStart, onChange, onRest } = this._events;
    const active = this._active.size > 0;
    const changed = this._changed.size > 0;
    if (active && !this._started || changed && !this._started) {
      this._started = true;
      flush(onStart, ([onStart2, result]) => {
        result.value = this.get();
        onStart2(result, this, this._item);
      });
    }
    const idle = !active && this._started;
    const values = changed || idle && onRest.size ? this.get() : null;
    if (changed && onChange.size) {
      flush(onChange, ([onChange2, result]) => {
        result.value = values;
        onChange2(result, this, this._item);
      });
    }
    if (idle) {
      this._started = false;
      flush(onRest, ([onRest2, result]) => {
        result.value = values;
        onRest2(result, this, this._item);
      });
    }
  }
  /** @internal */
  eventObserved(event) {
    if (event.type == "change") {
      this._changed.add(event.parent);
      if (!event.idle) {
        this._active.add(event.parent);
      }
    } else if (event.type == "idle") {
      this._active.delete(event.parent);
    } else return;
    raf.onFrame(this._onFrame);
  }
};
function flushUpdateQueue(ctrl, queue) {
  return Promise.all(queue.map((props) => flushUpdate(ctrl, props))).then(
    (results) => getCombinedResult(ctrl, results)
  );
}
async function flushUpdate(ctrl, props, isLoop) {
  const { keys, to: to22, from, loop: loop2, onRest, onResolve } = props;
  const defaults2 = is.obj(props.default) && props.default;
  if (loop2) {
    props.loop = false;
  }
  if (to22 === false) props.to = null;
  if (from === false) props.from = null;
  const asyncTo = is.arr(to22) || is.fun(to22) ? to22 : void 0;
  if (asyncTo) {
    props.to = void 0;
    props.onRest = void 0;
    if (defaults2) {
      defaults2.onRest = void 0;
    }
  } else {
    each(BATCHED_EVENTS, (key) => {
      const handler = props[key];
      if (is.fun(handler)) {
        const queue = ctrl["_events"][key];
        props[key] = ({ finished, cancelled }) => {
          const result2 = queue.get(handler);
          if (result2) {
            if (!finished) result2.finished = false;
            if (cancelled) result2.cancelled = true;
          } else {
            queue.set(handler, {
              value: null,
              finished: finished || false,
              cancelled: cancelled || false
            });
          }
        };
        if (defaults2) {
          defaults2[key] = props[key];
        }
      }
    });
  }
  const state = ctrl["_state"];
  if (props.pause === !state.paused) {
    state.paused = props.pause;
    flushCalls(props.pause ? state.pauseQueue : state.resumeQueue);
  } else if (state.paused) {
    props.pause = true;
  }
  const promises = (keys || Object.keys(ctrl.springs)).map(
    (key) => ctrl.springs[key].start(props)
  );
  const cancel = props.cancel === true || getDefaultProp(props, "cancel") === true;
  if (asyncTo || cancel && state.asyncId) {
    promises.push(
      scheduleProps(++ctrl["_lastAsyncId"], {
        props,
        state,
        actions: {
          pause: noop,
          resume: noop,
          start(props2, resolve) {
            if (cancel) {
              stopAsync(state, ctrl["_lastAsyncId"]);
              resolve(getCancelledResult(ctrl));
            } else {
              props2.onRest = onRest;
              resolve(
                runAsync(
                  asyncTo,
                  props2,
                  state,
                  ctrl
                )
              );
            }
          }
        }
      })
    );
  }
  if (state.paused) {
    await new Promise((resume) => {
      state.resumeQueue.add(resume);
    });
  }
  const result = getCombinedResult(ctrl, await Promise.all(promises));
  if (loop2 && result.finished && !(isLoop && result.noop)) {
    const nextProps = createLoopUpdate(props, loop2, to22);
    if (nextProps) {
      prepareKeys(ctrl, [nextProps]);
      return flushUpdate(ctrl, nextProps, true);
    }
  }
  if (onResolve) {
    raf.batchedUpdates(() => onResolve(result, ctrl, ctrl.item));
  }
  return result;
}
function getSprings(ctrl, props) {
  const springs = { ...ctrl.springs };
  if (props) {
    each(toArray(props), (props2) => {
      if (is.und(props2.keys)) {
        props2 = createUpdate(props2);
      }
      if (!is.obj(props2.to)) {
        props2 = { ...props2, to: void 0 };
      }
      prepareSprings(springs, props2, (key) => {
        return createSpring(key);
      });
    });
  }
  setSprings(ctrl, springs);
  return springs;
}
function setSprings(ctrl, springs) {
  eachProp(springs, (spring, key) => {
    if (!ctrl.springs[key]) {
      ctrl.springs[key] = spring;
      addFluidObserver(spring, ctrl);
    }
  });
}
function createSpring(key, observer) {
  const spring = new SpringValue();
  spring.key = key;
  if (observer) {
    addFluidObserver(spring, observer);
  }
  return spring;
}
function prepareSprings(springs, props, create) {
  if (props.keys) {
    each(props.keys, (key) => {
      const spring = springs[key] || (springs[key] = create(key));
      spring["_prepareNode"](props);
    });
  }
}
function prepareKeys(ctrl, queue) {
  each(queue, (props) => {
    prepareSprings(ctrl.springs, props, (key) => {
      return createSpring(key, ctrl);
    });
  });
}
var SpringContext = React2.createContext({
  pause: false,
  immediate: false
});
var SpringRef = () => {
  const current = [];
  const SpringRef2 = function(props) {
    deprecateDirectCall();
    const results = [];
    each(current, (ctrl, i7) => {
      if (is.und(props)) {
        results.push(ctrl.start());
      } else {
        const update22 = _getProps(props, ctrl, i7);
        if (update22) {
          results.push(ctrl.start(update22));
        }
      }
    });
    return results;
  };
  SpringRef2.current = current;
  SpringRef2.add = function(ctrl) {
    if (!current.includes(ctrl)) {
      current.push(ctrl);
    }
  };
  SpringRef2.delete = function(ctrl) {
    const i7 = current.indexOf(ctrl);
    if (~i7) current.splice(i7, 1);
  };
  SpringRef2.pause = function() {
    each(current, (ctrl) => ctrl.pause(...arguments));
    return this;
  };
  SpringRef2.resume = function() {
    each(current, (ctrl) => ctrl.resume(...arguments));
    return this;
  };
  SpringRef2.set = function(values) {
    each(current, (ctrl, i7) => {
      const update22 = is.fun(values) ? values(i7, ctrl) : values;
      if (update22) {
        ctrl.set(update22);
      }
    });
  };
  SpringRef2.start = function(props) {
    const results = [];
    each(current, (ctrl, i7) => {
      if (is.und(props)) {
        results.push(ctrl.start());
      } else {
        const update22 = this._getProps(props, ctrl, i7);
        if (update22) {
          results.push(ctrl.start(update22));
        }
      }
    });
    return results;
  };
  SpringRef2.stop = function() {
    each(current, (ctrl) => ctrl.stop(...arguments));
    return this;
  };
  SpringRef2.update = function(props) {
    each(current, (ctrl, i7) => ctrl.update(this._getProps(props, ctrl, i7)));
    return this;
  };
  const _getProps = function(arg, ctrl, index2) {
    return is.fun(arg) ? arg(index2, ctrl) : arg;
  };
  SpringRef2._getProps = _getProps;
  return SpringRef2;
};
function useSprings(length, props, deps) {
  const propsFn = is.fun(props) && props;
  if (propsFn && !deps) deps = [];
  const ref = (0, import_react10.useMemo)(
    () => propsFn || arguments.length == 3 ? SpringRef() : void 0,
    []
  );
  const layoutId = (0, import_react10.useRef)(0);
  const forceUpdate = useForceUpdate();
  const state = (0, import_react10.useMemo)(
    () => ({
      ctrls: [],
      queue: [],
      flush(ctrl, updates2) {
        const springs2 = getSprings(ctrl, updates2);
        const canFlushSync = layoutId.current > 0 && !state.queue.length && !Object.keys(springs2).some((key) => !ctrl.springs[key]);
        return canFlushSync ? flushUpdateQueue(ctrl, updates2) : new Promise((resolve) => {
          setSprings(ctrl, springs2);
          state.queue.push(() => {
            resolve(flushUpdateQueue(ctrl, updates2));
          });
          forceUpdate();
        });
      }
    }),
    []
  );
  const ctrls = (0, import_react10.useRef)([...state.ctrls]);
  const updates = (0, import_react10.useRef)([]);
  const prevLength = usePrev(length) || 0;
  (0, import_react10.useMemo)(() => {
    each(ctrls.current.slice(length, prevLength), (ctrl) => {
      detachRefs(ctrl, ref);
      ctrl.stop(true);
    });
    ctrls.current.length = length;
    declareUpdates(prevLength, length);
  }, [length]);
  (0, import_react10.useMemo)(() => {
    declareUpdates(0, Math.min(prevLength, length));
  }, deps);
  function declareUpdates(startIndex, endIndex) {
    for (let i7 = startIndex; i7 < endIndex; i7++) {
      const ctrl = ctrls.current[i7] || (ctrls.current[i7] = new Controller(null, state.flush));
      const update22 = propsFn ? propsFn(i7, ctrl) : props[i7];
      if (update22) {
        updates.current[i7] = declareUpdate(update22);
      }
    }
  }
  const springs = ctrls.current.map(
    (ctrl, i7) => getSprings(ctrl, updates.current[i7])
  );
  const context = (0, import_react10.useContext)(SpringContext);
  const prevContext = usePrev(context);
  const hasContext = context !== prevContext && hasProps(context);
  useIsomorphicLayoutEffect(() => {
    layoutId.current++;
    state.ctrls = ctrls.current;
    const { queue } = state;
    if (queue.length) {
      state.queue = [];
      each(queue, (cb) => cb());
    }
    each(ctrls.current, (ctrl, i7) => {
      ref?.add(ctrl);
      if (hasContext) {
        ctrl.start({ default: context });
      }
      const update22 = updates.current[i7];
      if (update22) {
        replaceRef(ctrl, update22.ref);
        if (ctrl.ref) {
          ctrl.queue.push(update22);
        } else {
          ctrl.start(update22);
        }
      }
    });
  });
  useOnce(() => () => {
    each(state.ctrls, (ctrl) => ctrl.stop(true));
  });
  const values = springs.map((x3) => ({ ...x3 }));
  return ref ? [values, ref] : values;
}
function useSpring(props, deps) {
  const isFn = is.fun(props);
  const [[values], ref] = useSprings(
    1,
    isFn ? props : [props],
    isFn ? deps || [] : deps
  );
  return isFn || arguments.length == 2 ? [values, ref] : values;
}
function useTransition(data, props, deps) {
  const propsFn = is.fun(props) && props;
  const {
    reset,
    sort: sort2,
    trail = 0,
    expires = true,
    exitBeforeEnter = false,
    onDestroyed,
    ref: propsRef,
    config: propsConfig
  } = propsFn ? propsFn() : props;
  const ref = (0, import_react13.useMemo)(
    () => propsFn || arguments.length == 3 ? SpringRef() : void 0,
    []
  );
  const items = toArray(data);
  const transitions = [];
  const usedTransitions = (0, import_react13.useRef)(null);
  const prevTransitions = reset ? null : usedTransitions.current;
  useIsomorphicLayoutEffect(() => {
    usedTransitions.current = transitions;
  });
  useOnce(() => {
    each(transitions, (t9) => {
      ref?.add(t9.ctrl);
      t9.ctrl.ref = ref;
    });
    return () => {
      each(usedTransitions.current, (t9) => {
        if (t9.expired) {
          clearTimeout(t9.expirationId);
        }
        detachRefs(t9.ctrl, ref);
        t9.ctrl.stop(true);
      });
    };
  });
  const keys = getKeys(items, propsFn ? propsFn() : props, prevTransitions);
  const expired = reset && usedTransitions.current || [];
  useIsomorphicLayoutEffect(
    () => each(expired, ({ ctrl, item, key }) => {
      detachRefs(ctrl, ref);
      callProp(onDestroyed, item, key);
    })
  );
  const reused = [];
  if (prevTransitions)
    each(prevTransitions, (t9, i7) => {
      if (t9.expired) {
        clearTimeout(t9.expirationId);
        expired.push(t9);
      } else {
        i7 = reused[i7] = keys.indexOf(t9.key);
        if (~i7) transitions[i7] = t9;
      }
    });
  each(items, (item, i7) => {
    if (!transitions[i7]) {
      transitions[i7] = {
        key: keys[i7],
        item,
        phase: "mount",
        ctrl: new Controller()
      };
      transitions[i7].ctrl.item = item;
    }
  });
  if (reused.length) {
    let i7 = -1;
    const { leave } = propsFn ? propsFn() : props;
    each(reused, (keyIndex, prevIndex) => {
      const t9 = prevTransitions[prevIndex];
      if (~keyIndex) {
        i7 = transitions.indexOf(t9);
        transitions[i7] = { ...t9, item: items[keyIndex] };
      } else if (leave) {
        transitions.splice(++i7, 0, t9);
      }
    });
  }
  if (is.fun(sort2)) {
    transitions.sort((a6, b6) => sort2(a6.item, b6.item));
  }
  let delay = -trail;
  const forceUpdate = useForceUpdate();
  const defaultProps = getDefaultProps(props);
  const changes = /* @__PURE__ */ new Map();
  const exitingTransitions = (0, import_react13.useRef)(/* @__PURE__ */ new Map());
  const forceChange = (0, import_react13.useRef)(false);
  each(transitions, (t9, i7) => {
    const key = t9.key;
    const prevPhase = t9.phase;
    const p4 = propsFn ? propsFn() : props;
    let to22;
    let phase;
    const propsDelay = callProp(p4.delay || 0, key);
    if (prevPhase == "mount") {
      to22 = p4.enter;
      phase = "enter";
    } else {
      const isLeave = keys.indexOf(key) < 0;
      if (prevPhase != "leave") {
        if (isLeave) {
          to22 = p4.leave;
          phase = "leave";
        } else if (to22 = p4.update) {
          phase = "update";
        } else return;
      } else if (!isLeave) {
        to22 = p4.enter;
        phase = "enter";
      } else return;
    }
    to22 = callProp(to22, t9.item, i7);
    to22 = is.obj(to22) ? inferTo(to22) : { to: to22 };
    if (!to22.config) {
      const config2 = propsConfig || defaultProps.config;
      to22.config = callProp(config2, t9.item, i7, phase);
    }
    delay += trail;
    const payload = {
      ...defaultProps,
      // we need to add our props.delay value you here.
      delay: propsDelay + delay,
      ref: propsRef,
      immediate: p4.immediate,
      // This prevents implied resets.
      reset: false,
      // Merge any phase-specific props.
      ...to22
    };
    if (phase == "enter" && is.und(payload.from)) {
      const p22 = propsFn ? propsFn() : props;
      const from = is.und(p22.initial) || prevTransitions ? p22.from : p22.initial;
      payload.from = callProp(from, t9.item, i7);
    }
    const { onResolve } = payload;
    payload.onResolve = (result) => {
      callProp(onResolve, result);
      const transitions2 = usedTransitions.current;
      const t23 = transitions2.find((t32) => t32.key === key);
      if (!t23) return;
      if (result.cancelled && t23.phase != "update") {
        return;
      }
      if (t23.ctrl.idle) {
        const idle = transitions2.every((t32) => t32.ctrl.idle);
        if (t23.phase == "leave") {
          const expiry = callProp(expires, t23.item);
          if (expiry !== false) {
            const expiryMs = expiry === true ? 0 : expiry;
            t23.expired = true;
            if (!idle && expiryMs > 0) {
              if (expiryMs <= 2147483647)
                t23.expirationId = setTimeout(forceUpdate, expiryMs);
              return;
            }
          }
        }
        if (idle && transitions2.some((t32) => t32.expired)) {
          exitingTransitions.current.delete(t23);
          if (exitBeforeEnter) {
            forceChange.current = true;
          }
          forceUpdate();
        }
      }
    };
    const springs = getSprings(t9.ctrl, payload);
    if (phase === "leave" && exitBeforeEnter) {
      exitingTransitions.current.set(t9, { phase, springs, payload });
    } else {
      changes.set(t9, { phase, springs, payload });
    }
  });
  const context = (0, import_react13.useContext)(SpringContext);
  const prevContext = usePrev(context);
  const hasContext = context !== prevContext && hasProps(context);
  useIsomorphicLayoutEffect(() => {
    if (hasContext) {
      each(transitions, (t9) => {
        t9.ctrl.start({ default: context });
      });
    }
  }, [context]);
  each(changes, (_3, t9) => {
    if (exitingTransitions.current.size) {
      const ind = transitions.findIndex((state) => state.key === t9.key);
      transitions.splice(ind, 1);
    }
  });
  useIsomorphicLayoutEffect(
    () => {
      each(
        exitingTransitions.current.size ? exitingTransitions.current : changes,
        ({ phase, payload }, t9) => {
          const { ctrl } = t9;
          t9.phase = phase;
          ref?.add(ctrl);
          if (hasContext && phase == "enter") {
            ctrl.start({ default: context });
          }
          if (payload) {
            replaceRef(ctrl, payload.ref);
            if ((ctrl.ref || ref) && !forceChange.current) {
              ctrl.update(payload);
            } else {
              ctrl.start(payload);
              if (forceChange.current) {
                forceChange.current = false;
              }
            }
          }
        }
      );
    },
    reset ? void 0 : deps
  );
  const renderTransitions = (render) => React22.createElement(React22.Fragment, null, transitions.map((t9, i7) => {
    const { springs } = changes.get(t9) || t9.ctrl;
    const elem = render({ ...springs }, t9.item, t9, i7);
    const key = is.str(t9.key) || is.num(t9.key) ? t9.key : t9.ctrl.id;
    const isLegacyReact = React22.version < "19.0.0";
    const props2 = elem?.props ?? {};
    const elemRef = isLegacyReact ? elem?.ref : props2?.ref;
    return elem && elem.type ? React22.createElement(elem.type, { ...props2, key, ref: elemRef }) : elem;
  }));
  return ref ? [renderTransitions, ref] : renderTransitions;
}
var nextKey = 1;
function getKeys(items, { key, keys = key }, prevTransitions) {
  if (keys === null) {
    const reused = /* @__PURE__ */ new Set();
    return items.map((item) => {
      const t9 = prevTransitions && prevTransitions.find(
        (t23) => t23.item === item && t23.phase !== "leave" && !reused.has(t23)
      );
      if (t9) {
        reused.add(t9);
        return t9.key;
      }
      return nextKey++;
    });
  }
  return is.und(keys) ? items : is.fun(keys) ? items.map(keys) : toArray(keys);
}
var Interpolation = class extends FrameValue {
  constructor(source, args) {
    super();
    this.source = source;
    this.idle = true;
    this._active = /* @__PURE__ */ new Set();
    this.calc = createInterpolator(...args);
    const value = this._get();
    const nodeType = getAnimatedType(value);
    setAnimated(this, nodeType.create(value));
  }
  advance(_dt) {
    const value = this._get();
    const oldValue = this.get();
    if (!isEqual(value, oldValue)) {
      getAnimated(this).setValue(value);
      this._onChange(value, this.idle);
    }
    if (!this.idle && checkIdle(this._active)) {
      becomeIdle(this);
    }
  }
  _get() {
    const inputs = is.arr(this.source) ? this.source.map(getFluidValue) : toArray(getFluidValue(this.source));
    return this.calc(...inputs);
  }
  _start() {
    if (this.idle && !checkIdle(this._active)) {
      this.idle = false;
      each(getPayload(this), (node) => {
        node.done = false;
      });
      if (globals_exports.skipAnimation) {
        raf.batchedUpdates(() => this.advance());
        becomeIdle(this);
      } else {
        frameLoop.start(this);
      }
    }
  }
  // Observe our sources only when we're observed.
  _attach() {
    let priority2 = 1;
    each(toArray(this.source), (source) => {
      if (hasFluidValue(source)) {
        addFluidObserver(source, this);
      }
      if (isFrameValue(source)) {
        if (!source.idle) {
          this._active.add(source);
        }
        priority2 = Math.max(priority2, source.priority + 1);
      }
    });
    this.priority = priority2;
    this._start();
  }
  // Stop observing our sources once we have no observers.
  _detach() {
    each(toArray(this.source), (source) => {
      if (hasFluidValue(source)) {
        removeFluidObserver(source, this);
      }
    });
    this._active.clear();
    becomeIdle(this);
  }
  /** @internal */
  eventObserved(event) {
    if (event.type == "change") {
      if (event.idle) {
        this.advance();
      } else {
        this._active.add(event.parent);
        this._start();
      }
    } else if (event.type == "idle") {
      this._active.delete(event.parent);
    } else if (event.type == "priority") {
      this.priority = toArray(this.source).reduce(
        (highest, parent) => Math.max(highest, (isFrameValue(parent) ? parent.priority : 0) + 1),
        0
      );
    }
  }
};
function isIdle(source) {
  return source.idle !== false;
}
function checkIdle(active) {
  return !active.size || Array.from(active).every(isIdle);
}
function becomeIdle(self2) {
  if (!self2.idle) {
    self2.idle = true;
    each(getPayload(self2), (node) => {
      node.done = true;
    });
    callFluidObservers(self2, {
      type: "idle",
      parent: self2
    });
  }
}
var to2 = (source, ...args) => new Interpolation(source, args);
globals_exports.assign({
  createStringInterpolator: createStringInterpolator2,
  to: (source, args) => new Interpolation(source, args)
});
var update2 = frameLoop.advance;

// node_modules/@react-spring/web/dist/react-spring_web.modern.mjs
var import_react_dom = __toESM(require_react_dom(), 1);
var isCustomPropRE = /^--/;
function dangerousStyleValue(name, value) {
  if (value == null || typeof value === "boolean" || value === "") return "";
  if (typeof value === "number" && value !== 0 && !isCustomPropRE.test(name) && !(isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name]))
    return value + "px";
  return ("" + value).trim();
}
var attributeCache = {};
function applyAnimatedValues(instance, props) {
  if (!instance.nodeType || !instance.setAttribute) {
    return false;
  }
  const isFilterElement = instance.nodeName === "filter" || instance.parentNode && instance.parentNode.nodeName === "filter";
  const {
    className,
    style,
    children,
    scrollTop,
    scrollLeft,
    viewBox,
    ...attributes
  } = props;
  const values = Object.values(attributes);
  const names = Object.keys(attributes).map(
    (name) => isFilterElement || instance.hasAttribute(name) ? name : attributeCache[name] || (attributeCache[name] = name.replace(
      /([A-Z])/g,
      // Attributes are written in dash case
      (n8) => "-" + n8.toLowerCase()
    ))
  );
  if (children !== void 0) {
    instance.textContent = children;
  }
  for (const name in style) {
    if (style.hasOwnProperty(name)) {
      const value = dangerousStyleValue(name, style[name]);
      if (isCustomPropRE.test(name)) {
        instance.style.setProperty(name, value);
      } else {
        instance.style[name] = value;
      }
    }
  }
  names.forEach((name, i7) => {
    instance.setAttribute(name, values[i7]);
  });
  if (className !== void 0) {
    instance.className = className;
  }
  if (scrollTop !== void 0) {
    instance.scrollTop = scrollTop;
  }
  if (scrollLeft !== void 0) {
    instance.scrollLeft = scrollLeft;
  }
  if (viewBox !== void 0) {
    instance.setAttribute("viewBox", viewBox);
  }
}
var isUnitlessNumber = {
  animationIterationCount: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
};
var prefixKey = (prefix2, key) => prefix2 + key.charAt(0).toUpperCase() + key.substring(1);
var prefixes = ["Webkit", "Ms", "Moz", "O"];
isUnitlessNumber = Object.keys(isUnitlessNumber).reduce((acc, prop) => {
  prefixes.forEach((prefix2) => acc[prefixKey(prefix2, prop)] = acc[prop]);
  return acc;
}, isUnitlessNumber);
var domTransforms = /^(matrix|translate|scale|rotate|skew)/;
var pxTransforms = /^(translate)/;
var degTransforms = /^(rotate|skew)/;
var addUnit = (value, unit2) => is.num(value) && value !== 0 ? value + unit2 : value;
var isValueIdentity = (value, id) => is.arr(value) ? value.every((v3) => isValueIdentity(v3, id)) : is.num(value) ? value === id : parseFloat(value) === id;
var AnimatedStyle = class extends AnimatedObject {
  constructor({ x: x3, y: y5, z: z6, ...style }) {
    const inputs = [];
    const transforms = [];
    if (x3 || y5 || z6) {
      inputs.push([x3 || 0, y5 || 0, z6 || 0]);
      transforms.push((xyz) => [
        `translate3d(${xyz.map((v3) => addUnit(v3, "px")).join(",")})`,
        // prettier-ignore
        isValueIdentity(xyz, 0)
      ]);
    }
    eachProp(style, (value, key) => {
      if (key === "transform") {
        inputs.push([value || ""]);
        transforms.push((transform) => [transform, transform === ""]);
      } else if (domTransforms.test(key)) {
        delete style[key];
        if (is.und(value)) return;
        const unit2 = pxTransforms.test(key) ? "px" : degTransforms.test(key) ? "deg" : "";
        inputs.push(toArray(value));
        transforms.push(
          key === "rotate3d" ? ([x22, y22, z22, deg]) => [
            `rotate3d(${x22},${y22},${z22},${addUnit(deg, unit2)})`,
            isValueIdentity(deg, 0)
          ] : (input) => [
            `${key}(${input.map((v3) => addUnit(v3, unit2)).join(",")})`,
            isValueIdentity(input, key.startsWith("scale") ? 1 : 0)
          ]
        );
      }
    });
    if (inputs.length) {
      style.transform = new FluidTransform(inputs, transforms);
    }
    super(style);
  }
};
var FluidTransform = class extends FluidValue {
  constructor(inputs, transforms) {
    super();
    this.inputs = inputs;
    this.transforms = transforms;
    this._value = null;
  }
  get() {
    return this._value || (this._value = this._get());
  }
  _get() {
    let transform = "";
    let identity5 = true;
    each(this.inputs, (input, i7) => {
      const arg1 = getFluidValue(input[0]);
      const [t9, id] = this.transforms[i7](
        is.arr(arg1) ? arg1 : input.map(getFluidValue)
      );
      transform += " " + t9;
      identity5 = identity5 && id;
    });
    return identity5 ? "none" : transform;
  }
  // Start observing our inputs once we have an observer.
  observerAdded(count2) {
    if (count2 == 1)
      each(
        this.inputs,
        (input) => each(
          input,
          (value) => hasFluidValue(value) && addFluidObserver(value, this)
        )
      );
  }
  // Stop observing our inputs once we have no observers.
  observerRemoved(count2) {
    if (count2 == 0)
      each(
        this.inputs,
        (input) => each(
          input,
          (value) => hasFluidValue(value) && removeFluidObserver(value, this)
        )
      );
  }
  eventObserved(event) {
    if (event.type == "change") {
      this._value = null;
    }
    callFluidObservers(this, event);
  }
};
var primitives = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  // SVG
  "circle",
  "clipPath",
  "defs",
  "ellipse",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "mask",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "svg",
  "text",
  "tspan"
];
globals_exports.assign({
  batchedUpdates: import_react_dom.unstable_batchedUpdates,
  createStringInterpolator: createStringInterpolator2,
  colors: colors2
});
var host = createHost(primitives, {
  applyAnimatedValues,
  createAnimatedStyle: (style) => new AnimatedStyle(style),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComponentProps: ({ scrollTop, scrollLeft, ...props }) => props
});
var animated = host.animated;

// node_modules/@nivo/theming/dist/nivo-theming.mjs
var import_react15 = __toESM(require_react(), 1);
var import_merge = __toESM(require_merge(), 1);
var import_get = __toESM(require_get(), 1);
var import_set = __toESM(require_set(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function u() {
  return u = Object.assign ? Object.assign.bind() : function(t9) {
    for (var e11 = 1; e11 < arguments.length; e11++) {
      var o5 = arguments[e11];
      for (var i7 in o5) ({}).hasOwnProperty.call(o5, i7) && (t9[i7] = o5[i7]);
    }
    return t9;
  }, u.apply(null, arguments);
}
function d(t9, e11) {
  if (null == t9) return {};
  var o5 = {};
  for (var i7 in t9) if ({}.hasOwnProperty.call(t9, i7)) {
    if (-1 !== e11.indexOf(i7)) continue;
    o5[i7] = t9[i7];
  }
  return o5;
}
var s = ["outlineWidth", "outlineColor", "outlineOpacity"];
var b = function(t9) {
  return t9.outlineWidth, t9.outlineColor, t9.outlineOpacity, d(t9, s);
};
var y = ["axis.ticks.text", "axis.legend.text", "legends.title.text", "legends.text", "legends.ticks.text", "legends.title.text", "labels.text", "dots.text", "markers.text", "annotations.text"];
var W = function(t9, e11) {
  return u({}, e11, t9);
};
var O = function(t9, e11) {
  var o5 = (0, import_merge.default)({}, t9, e11);
  return y.forEach((function(t10) {
    (0, import_set.default)(o5, t10, W((0, import_get.default)(o5, t10), o5.text));
  })), o5;
};
var R = function(t9, e11) {
  return e11 ? (0, import_merge.default)({}, t9, e11) : t9;
};
var C = { background: "transparent", text: { fontFamily: "sans-serif", fontSize: 11, fill: "#333333", outlineWidth: 0, outlineColor: "#ffffff", outlineOpacity: 1 }, axis: { domain: { line: { stroke: "transparent", strokeWidth: 1 } }, ticks: { line: { stroke: "#777777", strokeWidth: 1 }, text: {} }, legend: { text: { fontSize: 12 } } }, grid: { line: { stroke: "#dddddd", strokeWidth: 1 } }, legends: { hidden: { symbol: { fill: "#333333", opacity: 0.6 }, text: { fill: "#333333", opacity: 0.6 } }, text: {}, ticks: { line: { stroke: "#777777", strokeWidth: 1 }, text: { fontSize: 10 } }, title: { text: {} } }, labels: { text: {} }, markers: { lineColor: "#000000", lineStrokeWidth: 1, text: {} }, dots: { text: {} }, tooltip: { container: { background: "white", color: "inherit", fontSize: "inherit", borderRadius: "2px", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)", padding: "5px 9px" }, basic: { whiteSpace: "pre", display: "flex", alignItems: "center" }, chip: { marginRight: 7 }, table: {}, tableCell: { padding: "3px 5px" }, tableCellValue: { fontWeight: "bold" } }, crosshair: { line: { stroke: "#000000", strokeWidth: 1, strokeOpacity: 0.75, strokeDasharray: "6 6" } }, annotations: { text: { fontSize: 13, outlineWidth: 2, outlineColor: "#ffffff", outlineOpacity: 1 }, link: { stroke: "#000000", strokeWidth: 1, outlineWidth: 2, outlineColor: "#ffffff", outlineOpacity: 1 }, outline: { fill: "none", stroke: "#000000", strokeWidth: 2, outlineWidth: 2, outlineColor: "#ffffff", outlineOpacity: 1 }, symbol: { fill: "#000000", outlineWidth: 2, outlineColor: "#ffffff", outlineOpacity: 1 } } };
var L = function(e11) {
  return (0, import_react15.useMemo)((function() {
    return O(C, e11);
  }), [e11]);
};
var w = function(e11, o5) {
  return (0, import_react15.useMemo)((function() {
    return R(e11, o5);
  }), [e11, o5]);
};
var S = (0, import_react15.createContext)(null);
var j = {};
var z = function(t9) {
  var e11 = t9.theme, o5 = void 0 === e11 ? j : e11, i7 = t9.children, n8 = L(o5);
  return (0, import_jsx_runtime.jsx)(S.Provider, { value: n8, children: i7 });
};
var M = function() {
  var t9 = (0, import_react15.useContext)(S);
  if (null === t9) throw new Error("Unable to find the theme, did you forget to wrap your component with ThemeProvider?");
  return t9;
};

// node_modules/@nivo/tooltip/dist/nivo-tooltip.mjs
var import_react19 = __toESM(require_react(), 1);

// node_modules/@nivo/core/dist/nivo-core.mjs
var import_react18 = __toESM(require_react(), 1);
var import_isString = __toESM(require_isString(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);

// node_modules/react-virtualized-auto-sizer/dist/react-virtualized-auto-sizer.esm.js
var import_react16 = __toESM(require_react());
var windowObject;
if (typeof window !== "undefined") {
  windowObject = window;
} else if (typeof self !== "undefined") {
  windowObject = self;
} else {
  windowObject = global;
}
var cancelFrame = null;
var requestFrame = null;
var TIMEOUT_DURATION = 20;
var clearTimeoutFn = windowObject.clearTimeout;
var setTimeoutFn = windowObject.setTimeout;
var cancelAnimationFrameFn = windowObject.cancelAnimationFrame || windowObject.mozCancelAnimationFrame || windowObject.webkitCancelAnimationFrame;
var requestAnimationFrameFn = windowObject.requestAnimationFrame || windowObject.mozRequestAnimationFrame || windowObject.webkitRequestAnimationFrame;
if (cancelAnimationFrameFn == null || requestAnimationFrameFn == null) {
  cancelFrame = clearTimeoutFn;
  requestFrame = function requestAnimationFrameViaSetTimeout(callback) {
    return setTimeoutFn(callback, TIMEOUT_DURATION);
  };
} else {
  cancelFrame = function cancelFrame2([animationFrameID, timeoutID]) {
    cancelAnimationFrameFn(animationFrameID);
    clearTimeoutFn(timeoutID);
  };
  requestFrame = function requestAnimationFrameWithSetTimeoutFallback(callback) {
    const animationFrameID = requestAnimationFrameFn(function animationFrameCallback() {
      clearTimeoutFn(timeoutID);
      callback();
    });
    const timeoutID = setTimeoutFn(function timeoutCallback() {
      cancelAnimationFrameFn(animationFrameID);
      callback();
    }, TIMEOUT_DURATION);
    return [animationFrameID, timeoutID];
  };
}
function createDetectElementResize(nonce) {
  let animationKeyframes;
  let animationName;
  let animationStartEvent;
  let animationStyle;
  let checkTriggers;
  let resetTriggers;
  let scrollListener;
  const attachEvent = typeof document !== "undefined" && document.attachEvent;
  if (!attachEvent) {
    resetTriggers = function(element) {
      const triggers = element.__resizeTriggers__, expand = triggers.firstElementChild, contract = triggers.lastElementChild, expandChild = expand.firstElementChild;
      contract.scrollLeft = contract.scrollWidth;
      contract.scrollTop = contract.scrollHeight;
      expandChild.style.width = expand.offsetWidth + 1 + "px";
      expandChild.style.height = expand.offsetHeight + 1 + "px";
      expand.scrollLeft = expand.scrollWidth;
      expand.scrollTop = expand.scrollHeight;
    };
    checkTriggers = function(element) {
      return element.offsetWidth !== element.__resizeLast__.width || element.offsetHeight !== element.__resizeLast__.height;
    };
    scrollListener = function(e11) {
      if (e11.target.className && typeof e11.target.className.indexOf === "function" && e11.target.className.indexOf("contract-trigger") < 0 && e11.target.className.indexOf("expand-trigger") < 0) {
        return;
      }
      const element = this;
      resetTriggers(this);
      if (this.__resizeRAF__) {
        cancelFrame(this.__resizeRAF__);
      }
      this.__resizeRAF__ = requestFrame(function animationFrame() {
        if (checkTriggers(element)) {
          element.__resizeLast__.width = element.offsetWidth;
          element.__resizeLast__.height = element.offsetHeight;
          element.__resizeListeners__.forEach(function forEachResizeListener(fn3) {
            fn3.call(element, e11);
          });
        }
      });
    };
    let animation = false;
    let keyframeprefix = "";
    animationStartEvent = "animationstart";
    const domPrefixes = "Webkit Moz O ms".split(" ");
    let startEvents = "webkitAnimationStart animationstart oAnimationStart MSAnimationStart".split(" ");
    let pfx = "";
    {
      const elm = document.createElement("fakeelement");
      if (elm.style.animationName !== void 0) {
        animation = true;
      }
      if (animation === false) {
        for (let i7 = 0; i7 < domPrefixes.length; i7++) {
          if (elm.style[domPrefixes[i7] + "AnimationName"] !== void 0) {
            pfx = domPrefixes[i7];
            keyframeprefix = "-" + pfx.toLowerCase() + "-";
            animationStartEvent = startEvents[i7];
            animation = true;
            break;
          }
        }
      }
    }
    animationName = "resizeanim";
    animationKeyframes = "@" + keyframeprefix + "keyframes " + animationName + " { from { opacity: 0; } to { opacity: 0; } } ";
    animationStyle = keyframeprefix + "animation: 1ms " + animationName + "; ";
  }
  const createStyles = function(doc) {
    if (!doc.getElementById("detectElementResize")) {
      const css = (animationKeyframes ? animationKeyframes : "") + ".resize-triggers { " + (animationStyle ? animationStyle : "") + 'visibility: hidden; opacity: 0; } .resize-triggers, .resize-triggers > div, .contract-trigger:before { content: " "; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; z-index: -1; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }', head = doc.head || doc.getElementsByTagName("head")[0], style = doc.createElement("style");
      style.id = "detectElementResize";
      style.type = "text/css";
      if (nonce != null) {
        style.setAttribute("nonce", nonce);
      }
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(doc.createTextNode(css));
      }
      head.appendChild(style);
    }
  };
  const addResizeListener = function(element, fn3) {
    if (attachEvent) {
      element.attachEvent("onresize", fn3);
    } else {
      if (!element.__resizeTriggers__) {
        const doc = element.ownerDocument;
        const elementStyle = windowObject.getComputedStyle(element);
        if (elementStyle && elementStyle.position === "static") {
          element.style.position = "relative";
        }
        createStyles(doc);
        element.__resizeLast__ = {};
        element.__resizeListeners__ = [];
        (element.__resizeTriggers__ = doc.createElement("div")).className = "resize-triggers";
        const expandTrigger = doc.createElement("div");
        expandTrigger.className = "expand-trigger";
        expandTrigger.appendChild(doc.createElement("div"));
        const contractTrigger = doc.createElement("div");
        contractTrigger.className = "contract-trigger";
        element.__resizeTriggers__.appendChild(expandTrigger);
        element.__resizeTriggers__.appendChild(contractTrigger);
        element.appendChild(element.__resizeTriggers__);
        resetTriggers(element);
        element.addEventListener("scroll", scrollListener, true);
        if (animationStartEvent) {
          element.__resizeTriggers__.__animationListener__ = function animationListener(e11) {
            if (e11.animationName === animationName) {
              resetTriggers(element);
            }
          };
          element.__resizeTriggers__.addEventListener(animationStartEvent, element.__resizeTriggers__.__animationListener__);
        }
      }
      element.__resizeListeners__.push(fn3);
    }
  };
  const removeResizeListener = function(element, fn3) {
    if (attachEvent) {
      element.detachEvent("onresize", fn3);
    } else {
      element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn3), 1);
      if (!element.__resizeListeners__.length) {
        element.removeEventListener("scroll", scrollListener, true);
        if (element.__resizeTriggers__.__animationListener__) {
          element.__resizeTriggers__.removeEventListener(animationStartEvent, element.__resizeTriggers__.__animationListener__);
          element.__resizeTriggers__.__animationListener__ = null;
        }
        try {
          element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
        } catch (e11) {
        }
      }
    }
  };
  return {
    addResizeListener,
    removeResizeListener
  };
}
var AutoSizer = class extends import_react16.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      height: this.props.defaultHeight || 0,
      width: this.props.defaultWidth || 0
    };
    this._autoSizer = null;
    this._detectElementResize = null;
    this._didLogDeprecationWarning = false;
    this._parentNode = null;
    this._resizeObserver = null;
    this._timeoutId = null;
    this._onResize = () => {
      this._timeoutId = null;
      const {
        disableHeight,
        disableWidth,
        onResize: onResize2
      } = this.props;
      if (this._parentNode) {
        const style = window.getComputedStyle(this._parentNode) || {};
        const paddingLeft = parseFloat(style.paddingLeft || "0");
        const paddingRight = parseFloat(style.paddingRight || "0");
        const paddingTop = parseFloat(style.paddingTop || "0");
        const paddingBottom = parseFloat(style.paddingBottom || "0");
        const rect = this._parentNode.getBoundingClientRect();
        const height = rect.height - paddingTop - paddingBottom;
        const width = rect.width - paddingLeft - paddingRight;
        if (!disableHeight && this.state.height !== height || !disableWidth && this.state.width !== width) {
          this.setState({
            height,
            width
          });
          const maybeLogDeprecationWarning = () => {
            if (!this._didLogDeprecationWarning) {
              this._didLogDeprecationWarning = true;
              console.warn("scaledWidth and scaledHeight parameters have been deprecated; use width and height instead");
            }
          };
          if (typeof onResize2 === "function") {
            onResize2({
              height,
              width,
              // TODO Remove these params in the next major release
              get scaledHeight() {
                maybeLogDeprecationWarning();
                return height;
              },
              get scaledWidth() {
                maybeLogDeprecationWarning();
                return width;
              }
            });
          }
        }
      }
    };
    this._setRef = (autoSizer) => {
      this._autoSizer = autoSizer;
    };
  }
  componentDidMount() {
    const {
      nonce
    } = this.props;
    const parentNode = this._autoSizer ? this._autoSizer.parentNode : null;
    if (parentNode != null && parentNode.ownerDocument && parentNode.ownerDocument.defaultView && parentNode instanceof parentNode.ownerDocument.defaultView.HTMLElement) {
      this._parentNode = parentNode;
      const ResizeObserverInstance = parentNode.ownerDocument.defaultView.ResizeObserver;
      if (ResizeObserverInstance != null) {
        this._resizeObserver = new ResizeObserverInstance(() => {
          this._timeoutId = setTimeout(this._onResize, 0);
        });
        this._resizeObserver.observe(parentNode);
      } else {
        this._detectElementResize = createDetectElementResize(nonce);
        this._detectElementResize.addResizeListener(parentNode, this._onResize);
      }
      this._onResize();
    }
  }
  componentWillUnmount() {
    if (this._parentNode) {
      if (this._detectElementResize) {
        this._detectElementResize.removeResizeListener(this._parentNode, this._onResize);
      }
      if (this._timeoutId !== null) {
        clearTimeout(this._timeoutId);
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
      }
    }
  }
  render() {
    const {
      children,
      defaultHeight,
      defaultWidth,
      disableHeight = false,
      disableWidth = false,
      doNotBailOutOnEmptyChildren = false,
      nonce,
      onResize: onResize2,
      style = {},
      tagName = "div",
      ...rest
    } = this.props;
    const {
      height,
      width
    } = this.state;
    const outerStyle = {
      overflow: "visible"
    };
    const childParams = {};
    let bailoutOnChildren = false;
    if (!disableHeight) {
      if (height === 0) {
        bailoutOnChildren = true;
      }
      outerStyle.height = 0;
      childParams.height = height;
      childParams.scaledHeight = height;
    }
    if (!disableWidth) {
      if (width === 0) {
        bailoutOnChildren = true;
      }
      outerStyle.width = 0;
      childParams.width = width;
      childParams.scaledWidth = width;
    }
    if (doNotBailOutOnEmptyChildren) {
      bailoutOnChildren = false;
    }
    return (0, import_react16.createElement)(tagName, {
      ref: this._setRef,
      style: {
        ...outerStyle,
        ...style
      },
      ...rest
    }, !bailoutOnChildren && children(childParams));
  }
};

// node_modules/use-debounce/dist/index.module.js
var import_react17 = __toESM(require_react());
function c(e11, u5, c10, i7) {
  var a6 = this, o5 = (0, import_react17.useRef)(null), f2 = (0, import_react17.useRef)(0), l5 = (0, import_react17.useRef)(0), v3 = (0, import_react17.useRef)(null), m3 = (0, import_react17.useRef)([]), d5 = (0, import_react17.useRef)(), g2 = (0, import_react17.useRef)(), p4 = (0, import_react17.useRef)(e11), w4 = (0, import_react17.useRef)(true);
  p4.current = e11;
  var s6 = "undefined" != typeof window, x3 = !u5 && 0 !== u5 && s6;
  if ("function" != typeof e11) throw new TypeError("Expected a function");
  u5 = +u5 || 0;
  var h2 = !!(c10 = c10 || {}).leading, y5 = !("trailing" in c10) || !!c10.trailing, F2 = "maxWait" in c10, A5 = "debounceOnServer" in c10 && !!c10.debounceOnServer, D3 = F2 ? Math.max(+c10.maxWait || 0, u5) : null;
  (0, import_react17.useEffect)(function() {
    return w4.current = true, function() {
      w4.current = false;
    };
  }, []);
  var T3 = (0, import_react17.useMemo)(function() {
    var r7 = function(r8) {
      var n9 = m3.current, t10 = d5.current;
      return m3.current = d5.current = null, f2.current = r8, l5.current = l5.current || r8, g2.current = p4.current.apply(t10, n9);
    }, n8 = function(r8, n9) {
      x3 && cancelAnimationFrame(v3.current), v3.current = x3 ? requestAnimationFrame(r8) : setTimeout(r8, n9);
    }, t9 = function(r8) {
      if (!w4.current) return false;
      var n9 = r8 - o5.current;
      return !o5.current || n9 >= u5 || n9 < 0 || F2 && r8 - f2.current >= D3;
    }, e12 = function(n9) {
      return v3.current = null, y5 && m3.current ? r7(n9) : (m3.current = d5.current = null, g2.current);
    }, c11 = function r8() {
      var c12 = Date.now();
      if (h2 && l5.current === f2.current && T4(), t9(c12)) return e12(c12);
      if (w4.current) {
        var i8 = u5 - (c12 - o5.current), a7 = F2 ? Math.min(i8, D3 - (c12 - f2.current)) : i8;
        n8(r8, a7);
      }
    }, T4 = function() {
      i7 && i7({});
    }, W5 = function() {
      if (s6 || A5) {
        var e13 = Date.now(), i8 = t9(e13);
        if (m3.current = [].slice.call(arguments), d5.current = a6, o5.current = e13, i8) {
          if (!v3.current && w4.current) return f2.current = o5.current, n8(c11, u5), h2 ? r7(o5.current) : g2.current;
          if (F2) return n8(c11, u5), r7(o5.current);
        }
        return v3.current || n8(c11, u5), g2.current;
      }
    };
    return W5.cancel = function() {
      var r8 = v3.current;
      r8 && (x3 ? cancelAnimationFrame(v3.current) : clearTimeout(v3.current)), f2.current = 0, m3.current = o5.current = d5.current = v3.current = null, r8 && i7 && i7({});
    }, W5.isPending = function() {
      return !!v3.current;
    }, W5.flush = function() {
      return v3.current ? e12(Date.now()) : g2.current;
    }, W5;
  }, [h2, F2, u5, D3, y5, x3, s6, A5, i7]);
  return T3;
}
function i2(r7, n8) {
  return r7 === n8;
}
function a(n8, t9, a6) {
  var o5 = a6 && a6.equalityFn || i2, f2 = (0, import_react17.useRef)(n8), l5 = (0, import_react17.useState)({})[1], v3 = c((0, import_react17.useCallback)(function(r7) {
    f2.current = r7, l5({});
  }, [l5]), t9, a6, l5), m3 = (0, import_react17.useRef)(n8);
  return o5(m3.current, n8) || (v3(n8), m3.current = n8), [f2.current, v3];
}

// node_modules/d3-color/src/define.js
function define_default(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

// node_modules/d3-color/src/color.js
function Color() {
}
var darker = 0.7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex = /^#([0-9a-f]{3,8})$/;
var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
var named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define_default(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor(), this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color(format2) {
  var m3, l5;
  format2 = (format2 + "").trim().toLowerCase();
  return (m3 = reHex.exec(format2)) ? (l5 = m3[1].length, m3 = parseInt(m3[1], 16), l5 === 6 ? rgbn(m3) : l5 === 3 ? new Rgb(m3 >> 8 & 15 | m3 >> 4 & 240, m3 >> 4 & 15 | m3 & 240, (m3 & 15) << 4 | m3 & 15, 1) : l5 === 8 ? rgba2(m3 >> 24 & 255, m3 >> 16 & 255, m3 >> 8 & 255, (m3 & 255) / 255) : l5 === 4 ? rgba2(m3 >> 12 & 15 | m3 >> 8 & 240, m3 >> 8 & 15 | m3 >> 4 & 240, m3 >> 4 & 15 | m3 & 240, ((m3 & 15) << 4 | m3 & 15) / 255) : null) : (m3 = reRgbInteger.exec(format2)) ? new Rgb(m3[1], m3[2], m3[3], 1) : (m3 = reRgbPercent.exec(format2)) ? new Rgb(m3[1] * 255 / 100, m3[2] * 255 / 100, m3[3] * 255 / 100, 1) : (m3 = reRgbaInteger.exec(format2)) ? rgba2(m3[1], m3[2], m3[3], m3[4]) : (m3 = reRgbaPercent.exec(format2)) ? rgba2(m3[1] * 255 / 100, m3[2] * 255 / 100, m3[3] * 255 / 100, m3[4]) : (m3 = reHslPercent.exec(format2)) ? hsla2(m3[1], m3[2] / 100, m3[3] / 100, 1) : (m3 = reHslaPercent.exec(format2)) ? hsla2(m3[1], m3[2] / 100, m3[3] / 100, m3[4]) : named.hasOwnProperty(format2) ? rgbn(named[format2]) : format2 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n8) {
  return new Rgb(n8 >> 16 & 255, n8 >> 8 & 255, n8 & 255, 1);
}
function rgba2(r7, g2, b6, a6) {
  if (a6 <= 0) r7 = g2 = b6 = NaN;
  return new Rgb(r7, g2, b6, a6);
}
function rgbConvert(o5) {
  if (!(o5 instanceof Color)) o5 = color(o5);
  if (!o5) return new Rgb();
  o5 = o5.rgb();
  return new Rgb(o5.r, o5.g, o5.b, o5.opacity);
}
function rgb2(r7, g2, b6, opacity) {
  return arguments.length === 1 ? rgbConvert(r7) : new Rgb(r7, g2, b6, opacity == null ? 1 : opacity);
}
function Rgb(r7, g2, b6, opacity) {
  this.r = +r7;
  this.g = +g2;
  this.b = +b6;
  this.opacity = +opacity;
}
define_default(Rgb, rgb2, extend(Color, {
  brighter(k4) {
    k4 = k4 == null ? brighter : Math.pow(brighter, k4);
    return new Rgb(this.r * k4, this.g * k4, this.b * k4, this.opacity);
  },
  darker(k4) {
    k4 = k4 == null ? darker : Math.pow(darker, k4);
    return new Rgb(this.r * k4, this.g * k4, this.b * k4, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a6 = clampa(this.opacity);
  return `${a6 === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a6 === 1 ? ")" : `, ${a6})`}`;
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla2(h2, s6, l5, a6) {
  if (a6 <= 0) h2 = s6 = l5 = NaN;
  else if (l5 <= 0 || l5 >= 1) h2 = s6 = NaN;
  else if (s6 <= 0) h2 = NaN;
  return new Hsl(h2, s6, l5, a6);
}
function hslConvert(o5) {
  if (o5 instanceof Hsl) return new Hsl(o5.h, o5.s, o5.l, o5.opacity);
  if (!(o5 instanceof Color)) o5 = color(o5);
  if (!o5) return new Hsl();
  if (o5 instanceof Hsl) return o5;
  o5 = o5.rgb();
  var r7 = o5.r / 255, g2 = o5.g / 255, b6 = o5.b / 255, min3 = Math.min(r7, g2, b6), max3 = Math.max(r7, g2, b6), h2 = NaN, s6 = max3 - min3, l5 = (max3 + min3) / 2;
  if (s6) {
    if (r7 === max3) h2 = (g2 - b6) / s6 + (g2 < b6) * 6;
    else if (g2 === max3) h2 = (b6 - r7) / s6 + 2;
    else h2 = (r7 - g2) / s6 + 4;
    s6 /= l5 < 0.5 ? max3 + min3 : 2 - max3 - min3;
    h2 *= 60;
  } else {
    s6 = l5 > 0 && l5 < 1 ? 0 : h2;
  }
  return new Hsl(h2, s6, l5, o5.opacity);
}
function hsl2(h2, s6, l5, opacity) {
  return arguments.length === 1 ? hslConvert(h2) : new Hsl(h2, s6, l5, opacity == null ? 1 : opacity);
}
function Hsl(h2, s6, l5, opacity) {
  this.h = +h2;
  this.s = +s6;
  this.l = +l5;
  this.opacity = +opacity;
}
define_default(Hsl, hsl2, extend(Color, {
  brighter(k4) {
    k4 = k4 == null ? brighter : Math.pow(brighter, k4);
    return new Hsl(this.h, this.s, this.l * k4, this.opacity);
  },
  darker(k4) {
    k4 = k4 == null ? darker : Math.pow(darker, k4);
    return new Hsl(this.h, this.s, this.l * k4, this.opacity);
  },
  rgb() {
    var h2 = this.h % 360 + (this.h < 0) * 360, s6 = isNaN(h2) || isNaN(this.s) ? 0 : this.s, l5 = this.l, m22 = l5 + (l5 < 0.5 ? l5 : 1 - l5) * s6, m1 = 2 * l5 - m22;
    return new Rgb(
      hsl2rgb(h2 >= 240 ? h2 - 240 : h2 + 120, m1, m22),
      hsl2rgb(h2, m1, m22),
      hsl2rgb(h2 < 120 ? h2 + 240 : h2 - 120, m1, m22),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a6 = clampa(this.opacity);
    return `${a6 === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a6 === 1 ? ")" : `, ${a6})`}`;
  }
}));
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h2, m1, m22) {
  return (h2 < 60 ? m1 + (m22 - m1) * h2 / 60 : h2 < 180 ? m22 : h2 < 240 ? m1 + (m22 - m1) * (240 - h2) / 60 : m1) * 255;
}

// node_modules/d3-color/src/math.js
var radians = Math.PI / 180;
var degrees = 180 / Math.PI;

// node_modules/d3-color/src/lab.js
var K = 18;
var Xn = 0.96422;
var Yn = 1;
var Zn = 0.82521;
var t0 = 4 / 29;
var t1 = 6 / 29;
var t22 = 3 * t1 * t1;
var t3 = t1 * t1 * t1;
function labConvert(o5) {
  if (o5 instanceof Lab) return new Lab(o5.l, o5.a, o5.b, o5.opacity);
  if (o5 instanceof Hcl) return hcl2lab(o5);
  if (!(o5 instanceof Rgb)) o5 = rgbConvert(o5);
  var r7 = rgb2lrgb(o5.r), g2 = rgb2lrgb(o5.g), b6 = rgb2lrgb(o5.b), y5 = xyz2lab((0.2225045 * r7 + 0.7168786 * g2 + 0.0606169 * b6) / Yn), x3, z6;
  if (r7 === g2 && g2 === b6) x3 = z6 = y5;
  else {
    x3 = xyz2lab((0.4360747 * r7 + 0.3850649 * g2 + 0.1430804 * b6) / Xn);
    z6 = xyz2lab((0.0139322 * r7 + 0.0971045 * g2 + 0.7141733 * b6) / Zn);
  }
  return new Lab(116 * y5 - 16, 500 * (x3 - y5), 200 * (y5 - z6), o5.opacity);
}
function lab(l5, a6, b6, opacity) {
  return arguments.length === 1 ? labConvert(l5) : new Lab(l5, a6, b6, opacity == null ? 1 : opacity);
}
function Lab(l5, a6, b6, opacity) {
  this.l = +l5;
  this.a = +a6;
  this.b = +b6;
  this.opacity = +opacity;
}
define_default(Lab, lab, extend(Color, {
  brighter(k4) {
    return new Lab(this.l + K * (k4 == null ? 1 : k4), this.a, this.b, this.opacity);
  },
  darker(k4) {
    return new Lab(this.l - K * (k4 == null ? 1 : k4), this.a, this.b, this.opacity);
  },
  rgb() {
    var y5 = (this.l + 16) / 116, x3 = isNaN(this.a) ? y5 : y5 + this.a / 500, z6 = isNaN(this.b) ? y5 : y5 - this.b / 200;
    x3 = Xn * lab2xyz(x3);
    y5 = Yn * lab2xyz(y5);
    z6 = Zn * lab2xyz(z6);
    return new Rgb(
      lrgb2rgb(3.1338561 * x3 - 1.6168667 * y5 - 0.4906146 * z6),
      lrgb2rgb(-0.9787684 * x3 + 1.9161415 * y5 + 0.033454 * z6),
      lrgb2rgb(0.0719453 * x3 - 0.2289914 * y5 + 1.4052427 * z6),
      this.opacity
    );
  }
}));
function xyz2lab(t9) {
  return t9 > t3 ? Math.pow(t9, 1 / 3) : t9 / t22 + t0;
}
function lab2xyz(t9) {
  return t9 > t1 ? t9 * t9 * t9 : t22 * (t9 - t0);
}
function lrgb2rgb(x3) {
  return 255 * (x3 <= 31308e-7 ? 12.92 * x3 : 1.055 * Math.pow(x3, 1 / 2.4) - 0.055);
}
function rgb2lrgb(x3) {
  return (x3 /= 255) <= 0.04045 ? x3 / 12.92 : Math.pow((x3 + 0.055) / 1.055, 2.4);
}
function hclConvert(o5) {
  if (o5 instanceof Hcl) return new Hcl(o5.h, o5.c, o5.l, o5.opacity);
  if (!(o5 instanceof Lab)) o5 = labConvert(o5);
  if (o5.a === 0 && o5.b === 0) return new Hcl(NaN, 0 < o5.l && o5.l < 100 ? 0 : NaN, o5.l, o5.opacity);
  var h2 = Math.atan2(o5.b, o5.a) * degrees;
  return new Hcl(h2 < 0 ? h2 + 360 : h2, Math.sqrt(o5.a * o5.a + o5.b * o5.b), o5.l, o5.opacity);
}
function hcl(h2, c10, l5, opacity) {
  return arguments.length === 1 ? hclConvert(h2) : new Hcl(h2, c10, l5, opacity == null ? 1 : opacity);
}
function Hcl(h2, c10, l5, opacity) {
  this.h = +h2;
  this.c = +c10;
  this.l = +l5;
  this.opacity = +opacity;
}
function hcl2lab(o5) {
  if (isNaN(o5.h)) return new Lab(o5.l, 0, 0, o5.opacity);
  var h2 = o5.h * radians;
  return new Lab(o5.l, Math.cos(h2) * o5.c, Math.sin(h2) * o5.c, o5.opacity);
}
define_default(Hcl, hcl, extend(Color, {
  brighter(k4) {
    return new Hcl(this.h, this.c, this.l + K * (k4 == null ? 1 : k4), this.opacity);
  },
  darker(k4) {
    return new Hcl(this.h, this.c, this.l - K * (k4 == null ? 1 : k4), this.opacity);
  },
  rgb() {
    return hcl2lab(this).rgb();
  }
}));

// node_modules/d3-color/src/cubehelix.js
var A = -0.14861;
var B = 1.78277;
var C2 = -0.29227;
var D = -0.90649;
var E = 1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C2 - D * A;
function cubehelixConvert(o5) {
  if (o5 instanceof Cubehelix) return new Cubehelix(o5.h, o5.s, o5.l, o5.opacity);
  if (!(o5 instanceof Rgb)) o5 = rgbConvert(o5);
  var r7 = o5.r / 255, g2 = o5.g / 255, b6 = o5.b / 255, l5 = (BC_DA * b6 + ED * r7 - EB * g2) / (BC_DA + ED - EB), bl = b6 - l5, k4 = (E * (g2 - l5) - C2 * bl) / D, s6 = Math.sqrt(k4 * k4 + bl * bl) / (E * l5 * (1 - l5)), h2 = s6 ? Math.atan2(k4, bl) * degrees - 120 : NaN;
  return new Cubehelix(h2 < 0 ? h2 + 360 : h2, s6, l5, o5.opacity);
}
function cubehelix(h2, s6, l5, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h2) : new Cubehelix(h2, s6, l5, opacity == null ? 1 : opacity);
}
function Cubehelix(h2, s6, l5, opacity) {
  this.h = +h2;
  this.s = +s6;
  this.l = +l5;
  this.opacity = +opacity;
}
define_default(Cubehelix, cubehelix, extend(Color, {
  brighter(k4) {
    k4 = k4 == null ? brighter : Math.pow(brighter, k4);
    return new Cubehelix(this.h, this.s, this.l * k4, this.opacity);
  },
  darker(k4) {
    k4 = k4 == null ? darker : Math.pow(darker, k4);
    return new Cubehelix(this.h, this.s, this.l * k4, this.opacity);
  },
  rgb() {
    var h2 = isNaN(this.h) ? 0 : (this.h + 120) * radians, l5 = +this.l, a6 = isNaN(this.s) ? 0 : this.s * l5 * (1 - l5), cosh2 = Math.cos(h2), sinh2 = Math.sin(h2);
    return new Rgb(
      255 * (l5 + a6 * (A * cosh2 + B * sinh2)),
      255 * (l5 + a6 * (C2 * cosh2 + D * sinh2)),
      255 * (l5 + a6 * (E * cosh2)),
      this.opacity
    );
  }
}));

// node_modules/d3-interpolate/src/basis.js
function basis(t14, v0, v1, v22, v3) {
  var t23 = t14 * t14, t32 = t23 * t14;
  return ((1 - 3 * t14 + 3 * t23 - t32) * v0 + (4 - 6 * t23 + 3 * t32) * v1 + (1 + 3 * t14 + 3 * t23 - 3 * t32) * v22 + t32 * v3) / 6;
}
function basis_default(values) {
  var n8 = values.length - 1;
  return function(t9) {
    var i7 = t9 <= 0 ? t9 = 0 : t9 >= 1 ? (t9 = 1, n8 - 1) : Math.floor(t9 * n8), v1 = values[i7], v22 = values[i7 + 1], v0 = i7 > 0 ? values[i7 - 1] : 2 * v1 - v22, v3 = i7 < n8 - 1 ? values[i7 + 2] : 2 * v22 - v1;
    return basis((t9 - i7 / n8) * n8, v0, v1, v22, v3);
  };
}

// node_modules/d3-interpolate/src/basisClosed.js
function basisClosed_default(values) {
  var n8 = values.length;
  return function(t9) {
    var i7 = Math.floor(((t9 %= 1) < 0 ? ++t9 : t9) * n8), v0 = values[(i7 + n8 - 1) % n8], v1 = values[i7 % n8], v22 = values[(i7 + 1) % n8], v3 = values[(i7 + 2) % n8];
    return basis((t9 - i7 / n8) * n8, v0, v1, v22, v3);
  };
}

// node_modules/d3-interpolate/src/constant.js
var constant_default = (x3) => () => x3;

// node_modules/d3-interpolate/src/color.js
function linear(a6, d5) {
  return function(t9) {
    return a6 + t9 * d5;
  };
}
function exponential(a6, b6, y5) {
  return a6 = Math.pow(a6, y5), b6 = Math.pow(b6, y5) - a6, y5 = 1 / y5, function(t9) {
    return Math.pow(a6 + t9 * b6, y5);
  };
}
function hue(a6, b6) {
  var d5 = b6 - a6;
  return d5 ? linear(a6, d5 > 180 || d5 < -180 ? d5 - 360 * Math.round(d5 / 360) : d5) : constant_default(isNaN(a6) ? b6 : a6);
}
function gamma(y5) {
  return (y5 = +y5) === 1 ? nogamma : function(a6, b6) {
    return b6 - a6 ? exponential(a6, b6, y5) : constant_default(isNaN(a6) ? b6 : a6);
  };
}
function nogamma(a6, b6) {
  var d5 = b6 - a6;
  return d5 ? linear(a6, d5) : constant_default(isNaN(a6) ? b6 : a6);
}

// node_modules/d3-interpolate/src/rgb.js
var rgb_default = (function rgbGamma(y5) {
  var color2 = gamma(y5);
  function rgb3(start2, end) {
    var r7 = color2((start2 = rgb2(start2)).r, (end = rgb2(end)).r), g2 = color2(start2.g, end.g), b6 = color2(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
    return function(t9) {
      start2.r = r7(t9);
      start2.g = g2(t9);
      start2.b = b6(t9);
      start2.opacity = opacity(t9);
      return start2 + "";
    };
  }
  rgb3.gamma = rgbGamma;
  return rgb3;
})(1);
function rgbSpline(spline) {
  return function(colors3) {
    var n8 = colors3.length, r7 = new Array(n8), g2 = new Array(n8), b6 = new Array(n8), i7, color2;
    for (i7 = 0; i7 < n8; ++i7) {
      color2 = rgb2(colors3[i7]);
      r7[i7] = color2.r || 0;
      g2[i7] = color2.g || 0;
      b6[i7] = color2.b || 0;
    }
    r7 = spline(r7);
    g2 = spline(g2);
    b6 = spline(b6);
    color2.opacity = 1;
    return function(t9) {
      color2.r = r7(t9);
      color2.g = g2(t9);
      color2.b = b6(t9);
      return color2 + "";
    };
  };
}
var rgbBasis = rgbSpline(basis_default);
var rgbBasisClosed = rgbSpline(basisClosed_default);

// node_modules/d3-interpolate/src/numberArray.js
function numberArray_default(a6, b6) {
  if (!b6) b6 = [];
  var n8 = a6 ? Math.min(b6.length, a6.length) : 0, c10 = b6.slice(), i7;
  return function(t9) {
    for (i7 = 0; i7 < n8; ++i7) c10[i7] = a6[i7] * (1 - t9) + b6[i7] * t9;
    return c10;
  };
}
function isNumberArray(x3) {
  return ArrayBuffer.isView(x3) && !(x3 instanceof DataView);
}

// node_modules/d3-interpolate/src/array.js
function genericArray(a6, b6) {
  var nb = b6 ? b6.length : 0, na = a6 ? Math.min(nb, a6.length) : 0, x3 = new Array(na), c10 = new Array(nb), i7;
  for (i7 = 0; i7 < na; ++i7) x3[i7] = value_default(a6[i7], b6[i7]);
  for (; i7 < nb; ++i7) c10[i7] = b6[i7];
  return function(t9) {
    for (i7 = 0; i7 < na; ++i7) c10[i7] = x3[i7](t9);
    return c10;
  };
}

// node_modules/d3-interpolate/src/date.js
function date_default(a6, b6) {
  var d5 = /* @__PURE__ */ new Date();
  return a6 = +a6, b6 = +b6, function(t9) {
    return d5.setTime(a6 * (1 - t9) + b6 * t9), d5;
  };
}

// node_modules/d3-interpolate/src/number.js
function number_default(a6, b6) {
  return a6 = +a6, b6 = +b6, function(t9) {
    return a6 * (1 - t9) + b6 * t9;
  };
}

// node_modules/d3-interpolate/src/object.js
function object_default(a6, b6) {
  var i7 = {}, c10 = {}, k4;
  if (a6 === null || typeof a6 !== "object") a6 = {};
  if (b6 === null || typeof b6 !== "object") b6 = {};
  for (k4 in b6) {
    if (k4 in a6) {
      i7[k4] = value_default(a6[k4], b6[k4]);
    } else {
      c10[k4] = b6[k4];
    }
  }
  return function(t9) {
    for (k4 in i7) c10[k4] = i7[k4](t9);
    return c10;
  };
}

// node_modules/d3-interpolate/src/string.js
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero(b6) {
  return function() {
    return b6;
  };
}
function one(b6) {
  return function(t9) {
    return b6(t9) + "";
  };
}
function string_default(a6, b6) {
  var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i7 = -1, s6 = [], q2 = [];
  a6 = a6 + "", b6 = b6 + "";
  while ((am = reA.exec(a6)) && (bm = reB.exec(b6))) {
    if ((bs = bm.index) > bi) {
      bs = b6.slice(bi, bs);
      if (s6[i7]) s6[i7] += bs;
      else s6[++i7] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s6[i7]) s6[i7] += bm;
      else s6[++i7] = bm;
    } else {
      s6[++i7] = null;
      q2.push({ i: i7, x: number_default(am, bm) });
    }
    bi = reB.lastIndex;
  }
  if (bi < b6.length) {
    bs = b6.slice(bi);
    if (s6[i7]) s6[i7] += bs;
    else s6[++i7] = bs;
  }
  return s6.length < 2 ? q2[0] ? one(q2[0].x) : zero(b6) : (b6 = q2.length, function(t9) {
    for (var i8 = 0, o5; i8 < b6; ++i8) s6[(o5 = q2[i8]).i] = o5.x(t9);
    return s6.join("");
  });
}

// node_modules/d3-interpolate/src/value.js
function value_default(a6, b6) {
  var t9 = typeof b6, c10;
  return b6 == null || t9 === "boolean" ? constant_default(b6) : (t9 === "number" ? number_default : t9 === "string" ? (c10 = color(b6)) ? (b6 = c10, rgb_default) : string_default : b6 instanceof color ? rgb_default : b6 instanceof Date ? date_default : isNumberArray(b6) ? numberArray_default : Array.isArray(b6) ? genericArray : typeof b6.valueOf !== "function" && typeof b6.toString !== "function" || isNaN(b6) ? object_default : number_default)(a6, b6);
}

// node_modules/d3-interpolate/src/round.js
function round_default(a6, b6) {
  return a6 = +a6, b6 = +b6, function(t9) {
    return Math.round(a6 * (1 - t9) + b6 * t9);
  };
}

// node_modules/d3-interpolate/src/transform/decompose.js
var degrees2 = 180 / Math.PI;
var identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
function decompose_default(a6, b6, c10, d5, e11, f2) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a6 * a6 + b6 * b6)) a6 /= scaleX, b6 /= scaleX;
  if (skewX = a6 * c10 + b6 * d5) c10 -= a6 * skewX, d5 -= b6 * skewX;
  if (scaleY = Math.sqrt(c10 * c10 + d5 * d5)) c10 /= scaleY, d5 /= scaleY, skewX /= scaleY;
  if (a6 * d5 < b6 * c10) a6 = -a6, b6 = -b6, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e11,
    translateY: f2,
    rotate: Math.atan2(b6, a6) * degrees2,
    skewX: Math.atan(skewX) * degrees2,
    scaleX,
    scaleY
  };
}

// node_modules/d3-interpolate/src/transform/parse.js
var svgNode;
function parseCss(value) {
  const m3 = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m3.isIdentity ? identity : decompose_default(m3.a, m3.b, m3.c, m3.d, m3.e, m3.f);
}
function parseSvg(value) {
  if (value == null) return identity;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
  value = value.matrix;
  return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
}

// node_modules/d3-interpolate/src/transform/index.js
function interpolateTransform(parse, pxComma, pxParen, degParen) {
  function pop(s6) {
    return s6.length ? s6.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s6, q2) {
    if (xa !== xb || ya !== yb) {
      var i7 = s6.push("translate(", null, pxComma, null, pxParen);
      q2.push({ i: i7 - 4, x: number_default(xa, xb) }, { i: i7 - 2, x: number_default(ya, yb) });
    } else if (xb || yb) {
      s6.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a6, b6, s6, q2) {
    if (a6 !== b6) {
      if (a6 - b6 > 180) b6 += 360;
      else if (b6 - a6 > 180) a6 += 360;
      q2.push({ i: s6.push(pop(s6) + "rotate(", null, degParen) - 2, x: number_default(a6, b6) });
    } else if (b6) {
      s6.push(pop(s6) + "rotate(" + b6 + degParen);
    }
  }
  function skewX(a6, b6, s6, q2) {
    if (a6 !== b6) {
      q2.push({ i: s6.push(pop(s6) + "skewX(", null, degParen) - 2, x: number_default(a6, b6) });
    } else if (b6) {
      s6.push(pop(s6) + "skewX(" + b6 + degParen);
    }
  }
  function scale(xa, ya, xb, yb, s6, q2) {
    if (xa !== xb || ya !== yb) {
      var i7 = s6.push(pop(s6) + "scale(", null, ",", null, ")");
      q2.push({ i: i7 - 4, x: number_default(xa, xb) }, { i: i7 - 2, x: number_default(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s6.push(pop(s6) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a6, b6) {
    var s6 = [], q2 = [];
    a6 = parse(a6), b6 = parse(b6);
    translate(a6.translateX, a6.translateY, b6.translateX, b6.translateY, s6, q2);
    rotate(a6.rotate, b6.rotate, s6, q2);
    skewX(a6.skewX, b6.skewX, s6, q2);
    scale(a6.scaleX, a6.scaleY, b6.scaleX, b6.scaleY, s6, q2);
    a6 = b6 = null;
    return function(t9) {
      var i7 = -1, n8 = q2.length, o5;
      while (++i7 < n8) s6[(o5 = q2[i7]).i] = o5.x(t9);
      return s6.join("");
    };
  };
}
var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

// node_modules/d3-interpolate/src/zoom.js
var epsilon2 = 1e-12;
function cosh(x3) {
  return ((x3 = Math.exp(x3)) + 1 / x3) / 2;
}
function sinh(x3) {
  return ((x3 = Math.exp(x3)) - 1 / x3) / 2;
}
function tanh(x3) {
  return ((x3 = Math.exp(2 * x3)) - 1) / (x3 + 1);
}
var zoom_default = (function zoomRho(rho, rho2, rho4) {
  function zoom(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d22 = dx * dx + dy * dy, i7, S4;
    if (d22 < epsilon2) {
      S4 = Math.log(w1 / w0) / rho;
      i7 = function(t9) {
        return [
          ux0 + t9 * dx,
          uy0 + t9 * dy,
          w0 * Math.exp(rho * t9 * S4)
        ];
      };
    } else {
      var d1 = Math.sqrt(d22), b0 = (w1 * w1 - w0 * w0 + rho4 * d22) / (2 * w0 * rho2 * d1), b1 = (w1 * w1 - w0 * w0 - rho4 * d22) / (2 * w1 * rho2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S4 = (r1 - r0) / rho;
      i7 = function(t9) {
        var s6 = t9 * S4, coshr0 = cosh(r0), u5 = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s6 + r0) - sinh(r0));
        return [
          ux0 + u5 * dx,
          uy0 + u5 * dy,
          w0 * coshr0 / cosh(rho * s6 + r0)
        ];
      };
    }
    i7.duration = S4 * 1e3 * rho / Math.SQRT2;
    return i7;
  }
  zoom.rho = function(_3) {
    var _1 = Math.max(1e-3, +_3), _22 = _1 * _1, _4 = _22 * _22;
    return zoomRho(_1, _22, _4);
  };
  return zoom;
})(Math.SQRT2, 2, 4);

// node_modules/d3-interpolate/src/hsl.js
function hsl3(hue2) {
  return function(start2, end) {
    var h2 = hue2((start2 = hsl2(start2)).h, (end = hsl2(end)).h), s6 = nogamma(start2.s, end.s), l5 = nogamma(start2.l, end.l), opacity = nogamma(start2.opacity, end.opacity);
    return function(t9) {
      start2.h = h2(t9);
      start2.s = s6(t9);
      start2.l = l5(t9);
      start2.opacity = opacity(t9);
      return start2 + "";
    };
  };
}
var hsl_default = hsl3(hue);
var hslLong = hsl3(nogamma);

// node_modules/d3-interpolate/src/hcl.js
function hcl2(hue2) {
  return function(start2, end) {
    var h2 = hue2((start2 = hcl(start2)).h, (end = hcl(end)).h), c10 = nogamma(start2.c, end.c), l5 = nogamma(start2.l, end.l), opacity = nogamma(start2.opacity, end.opacity);
    return function(t9) {
      start2.h = h2(t9);
      start2.c = c10(t9);
      start2.l = l5(t9);
      start2.opacity = opacity(t9);
      return start2 + "";
    };
  };
}
var hcl_default = hcl2(hue);
var hclLong = hcl2(nogamma);

// node_modules/d3-interpolate/src/cubehelix.js
function cubehelix2(hue2) {
  return (function cubehelixGamma(y5) {
    y5 = +y5;
    function cubehelix3(start2, end) {
      var h2 = hue2((start2 = cubehelix(start2)).h, (end = cubehelix(end)).h), s6 = nogamma(start2.s, end.s), l5 = nogamma(start2.l, end.l), opacity = nogamma(start2.opacity, end.opacity);
      return function(t9) {
        start2.h = h2(t9);
        start2.s = s6(t9);
        start2.l = l5(Math.pow(t9, y5));
        start2.opacity = opacity(t9);
        return start2 + "";
      };
    }
    cubehelix3.gamma = cubehelixGamma;
    return cubehelix3;
  })(1);
}
var cubehelix_default = cubehelix2(hue);
var cubehelixLong = cubehelix2(nogamma);

// node_modules/@nivo/core/dist/nivo-core.mjs
var import_without = __toESM(require_without(), 1);

// node_modules/d3-shape/src/constant.js
function constant_default2(x3) {
  return function constant2() {
    return x3;
  };
}

// node_modules/d3-shape/src/math.js
var cos = Math.cos;
var sin = Math.sin;
var sqrt = Math.sqrt;
var epsilon = 1e-12;
var pi = Math.PI;
var halfPi = pi / 2;
var tau = 2 * pi;

// node_modules/d3-path/src/path.js
var pi2 = Math.PI;
var tau2 = 2 * pi2;
var epsilon3 = 1e-6;
var tauEpsilon = tau2 - epsilon3;
function append(strings) {
  this._ += strings[0];
  for (let i7 = 1, n8 = strings.length; i7 < n8; ++i7) {
    this._ += arguments[i7] + strings[i7];
  }
}
function appendRound(digits) {
  let d5 = Math.floor(digits);
  if (!(d5 >= 0)) throw new Error(`invalid digits: ${digits}`);
  if (d5 > 15) return append;
  const k4 = 10 ** d5;
  return function(strings) {
    this._ += strings[0];
    for (let i7 = 1, n8 = strings.length; i7 < n8; ++i7) {
      this._ += Math.round(arguments[i7] * k4) / k4 + strings[i7];
    }
  };
}
var Path = class {
  constructor(digits) {
    this._x0 = this._y0 = // start of current subpath
    this._x1 = this._y1 = null;
    this._ = "";
    this._append = digits == null ? append : appendRound(digits);
  }
  moveTo(x3, y5) {
    this._append`M${this._x0 = this._x1 = +x3},${this._y0 = this._y1 = +y5}`;
  }
  closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._append`Z`;
    }
  }
  lineTo(x3, y5) {
    this._append`L${this._x1 = +x3},${this._y1 = +y5}`;
  }
  quadraticCurveTo(x1, y1, x3, y5) {
    this._append`Q${+x1},${+y1},${this._x1 = +x3},${this._y1 = +y5}`;
  }
  bezierCurveTo(x1, y1, x22, y22, x3, y5) {
    this._append`C${+x1},${+y1},${+x22},${+y22},${this._x1 = +x3},${this._y1 = +y5}`;
  }
  arcTo(x1, y1, x22, y22, r7) {
    x1 = +x1, y1 = +y1, x22 = +x22, y22 = +y22, r7 = +r7;
    if (r7 < 0) throw new Error(`negative radius: ${r7}`);
    let x0 = this._x1, y0 = this._y1, x21 = x22 - x1, y21 = y22 - y1, x01 = x0 - x1, y01 = y0 - y1, l01_2 = x01 * x01 + y01 * y01;
    if (this._x1 === null) {
      this._append`M${this._x1 = x1},${this._y1 = y1}`;
    } else if (!(l01_2 > epsilon3)) ;
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon3) || !r7) {
      this._append`L${this._x1 = x1},${this._y1 = y1}`;
    } else {
      let x20 = x22 - x0, y20 = y22 - y0, l21_2 = x21 * x21 + y21 * y21, l20_2 = x20 * x20 + y20 * y20, l21 = Math.sqrt(l21_2), l01 = Math.sqrt(l01_2), l5 = r7 * Math.tan((pi2 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2), t01 = l5 / l01, t21 = l5 / l21;
      if (Math.abs(t01 - 1) > epsilon3) {
        this._append`L${x1 + t01 * x01},${y1 + t01 * y01}`;
      }
      this._append`A${r7},${r7},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x1 + t21 * x21},${this._y1 = y1 + t21 * y21}`;
    }
  }
  arc(x3, y5, r7, a0, a1, ccw) {
    x3 = +x3, y5 = +y5, r7 = +r7, ccw = !!ccw;
    if (r7 < 0) throw new Error(`negative radius: ${r7}`);
    let dx = r7 * Math.cos(a0), dy = r7 * Math.sin(a0), x0 = x3 + dx, y0 = y5 + dy, cw = 1 ^ ccw, da = ccw ? a0 - a1 : a1 - a0;
    if (this._x1 === null) {
      this._append`M${x0},${y0}`;
    } else if (Math.abs(this._x1 - x0) > epsilon3 || Math.abs(this._y1 - y0) > epsilon3) {
      this._append`L${x0},${y0}`;
    }
    if (!r7) return;
    if (da < 0) da = da % tau2 + tau2;
    if (da > tauEpsilon) {
      this._append`A${r7},${r7},0,1,${cw},${x3 - dx},${y5 - dy}A${r7},${r7},0,1,${cw},${this._x1 = x0},${this._y1 = y0}`;
    } else if (da > epsilon3) {
      this._append`A${r7},${r7},0,${+(da >= pi2)},${cw},${this._x1 = x3 + r7 * Math.cos(a1)},${this._y1 = y5 + r7 * Math.sin(a1)}`;
    }
  }
  rect(x3, y5, w4, h2) {
    this._append`M${this._x0 = this._x1 = +x3},${this._y0 = this._y1 = +y5}h${w4 = +w4}v${+h2}h${-w4}Z`;
  }
  toString() {
    return this._;
  }
};
function path() {
  return new Path();
}
path.prototype = Path.prototype;

// node_modules/d3-shape/src/path.js
function withPath(shape) {
  let digits = 3;
  shape.digits = function(_3) {
    if (!arguments.length) return digits;
    if (_3 == null) {
      digits = null;
    } else {
      const d5 = Math.floor(_3);
      if (!(d5 >= 0)) throw new RangeError(`invalid digits: ${_3}`);
      digits = d5;
    }
    return shape;
  };
  return () => new Path(digits);
}

// node_modules/d3-shape/src/array.js
var slice = Array.prototype.slice;
function array_default2(x3) {
  return typeof x3 === "object" && "length" in x3 ? x3 : Array.from(x3);
}

// node_modules/d3-shape/src/curve/linear.js
function Linear(context) {
  this._context = context;
}
Linear.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x3, y5) : this._context.moveTo(x3, y5);
        break;
      case 1:
        this._point = 2;
      // falls through
      default:
        this._context.lineTo(x3, y5);
        break;
    }
  }
};
function linear_default(context) {
  return new Linear(context);
}

// node_modules/d3-shape/src/point.js
function x(p4) {
  return p4[0];
}
function y2(p4) {
  return p4[1];
}

// node_modules/d3-shape/src/line.js
function line_default(x3, y5) {
  var defined = constant_default2(true), context = null, curve = linear_default, output = null, path2 = withPath(line);
  x3 = typeof x3 === "function" ? x3 : x3 === void 0 ? x : constant_default2(x3);
  y5 = typeof y5 === "function" ? y5 : y5 === void 0 ? y2 : constant_default2(y5);
  function line(data) {
    var i7, n8 = (data = array_default2(data)).length, d5, defined0 = false, buffer;
    if (context == null) output = curve(buffer = path2());
    for (i7 = 0; i7 <= n8; ++i7) {
      if (!(i7 < n8 && defined(d5 = data[i7], i7, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();
        else output.lineEnd();
      }
      if (defined0) output.point(+x3(d5, i7, data), +y5(d5, i7, data));
    }
    if (buffer) return output = null, buffer + "" || null;
  }
  line.x = function(_3) {
    return arguments.length ? (x3 = typeof _3 === "function" ? _3 : constant_default2(+_3), line) : x3;
  };
  line.y = function(_3) {
    return arguments.length ? (y5 = typeof _3 === "function" ? _3 : constant_default2(+_3), line) : y5;
  };
  line.defined = function(_3) {
    return arguments.length ? (defined = typeof _3 === "function" ? _3 : constant_default2(!!_3), line) : defined;
  };
  line.curve = function(_3) {
    return arguments.length ? (curve = _3, context != null && (output = curve(context)), line) : curve;
  };
  line.context = function(_3) {
    return arguments.length ? (_3 == null ? context = output = null : output = curve(context = _3), line) : context;
  };
  return line;
}

// node_modules/d3-shape/src/area.js
function area_default(x0, y0, y1) {
  var x1 = null, defined = constant_default2(true), context = null, curve = linear_default, output = null, path2 = withPath(area);
  x0 = typeof x0 === "function" ? x0 : x0 === void 0 ? x : constant_default2(+x0);
  y0 = typeof y0 === "function" ? y0 : y0 === void 0 ? constant_default2(0) : constant_default2(+y0);
  y1 = typeof y1 === "function" ? y1 : y1 === void 0 ? y2 : constant_default2(+y1);
  function area(data) {
    var i7, j5, k4, n8 = (data = array_default2(data)).length, d5, defined0 = false, buffer, x0z = new Array(n8), y0z = new Array(n8);
    if (context == null) output = curve(buffer = path2());
    for (i7 = 0; i7 <= n8; ++i7) {
      if (!(i7 < n8 && defined(d5 = data[i7], i7, data)) === defined0) {
        if (defined0 = !defined0) {
          j5 = i7;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k4 = i7 - 1; k4 >= j5; --k4) {
            output.point(x0z[k4], y0z[k4]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i7] = +x0(d5, i7, data), y0z[i7] = +y0(d5, i7, data);
        output.point(x1 ? +x1(d5, i7, data) : x0z[i7], y1 ? +y1(d5, i7, data) : y0z[i7]);
      }
    }
    if (buffer) return output = null, buffer + "" || null;
  }
  function arealine() {
    return line_default().defined(defined).curve(curve).context(context);
  }
  area.x = function(_3) {
    return arguments.length ? (x0 = typeof _3 === "function" ? _3 : constant_default2(+_3), x1 = null, area) : x0;
  };
  area.x0 = function(_3) {
    return arguments.length ? (x0 = typeof _3 === "function" ? _3 : constant_default2(+_3), area) : x0;
  };
  area.x1 = function(_3) {
    return arguments.length ? (x1 = _3 == null ? null : typeof _3 === "function" ? _3 : constant_default2(+_3), area) : x1;
  };
  area.y = function(_3) {
    return arguments.length ? (y0 = typeof _3 === "function" ? _3 : constant_default2(+_3), y1 = null, area) : y0;
  };
  area.y0 = function(_3) {
    return arguments.length ? (y0 = typeof _3 === "function" ? _3 : constant_default2(+_3), area) : y0;
  };
  area.y1 = function(_3) {
    return arguments.length ? (y1 = _3 == null ? null : typeof _3 === "function" ? _3 : constant_default2(+_3), area) : y1;
  };
  area.lineX0 = area.lineY0 = function() {
    return arealine().x(x0).y(y0);
  };
  area.lineY1 = function() {
    return arealine().x(x0).y(y1);
  };
  area.lineX1 = function() {
    return arealine().x(x1).y(y0);
  };
  area.defined = function(_3) {
    return arguments.length ? (defined = typeof _3 === "function" ? _3 : constant_default2(!!_3), area) : defined;
  };
  area.curve = function(_3) {
    return arguments.length ? (curve = _3, context != null && (output = curve(context)), area) : curve;
  };
  area.context = function(_3) {
    return arguments.length ? (_3 == null ? context = output = null : output = curve(context = _3), area) : context;
  };
  return area;
}

// node_modules/d3-shape/src/curve/radial.js
var curveRadialLinear = curveRadial(linear_default);
function Radial(curve) {
  this._curve = curve;
}
Radial.prototype = {
  areaStart: function() {
    this._curve.areaStart();
  },
  areaEnd: function() {
    this._curve.areaEnd();
  },
  lineStart: function() {
    this._curve.lineStart();
  },
  lineEnd: function() {
    this._curve.lineEnd();
  },
  point: function(a6, r7) {
    this._curve.point(r7 * Math.sin(a6), r7 * -Math.cos(a6));
  }
};
function curveRadial(curve) {
  function radial2(context) {
    return new Radial(curve(context));
  }
  radial2._curve = curve;
  return radial2;
}

// node_modules/d3-shape/src/symbol/asterisk.js
var sqrt3 = sqrt(3);

// node_modules/d3-shape/src/symbol/diamond.js
var tan30 = sqrt(1 / 3);
var tan30_2 = tan30 * 2;

// node_modules/d3-shape/src/symbol/star.js
var kr = sin(pi / 10) / sin(7 * pi / 10);
var kx = sin(tau / 10) * kr;
var ky = -cos(tau / 10) * kr;

// node_modules/d3-shape/src/symbol/triangle.js
var sqrt32 = sqrt(3);

// node_modules/d3-shape/src/symbol/triangle2.js
var sqrt33 = sqrt(3);

// node_modules/d3-shape/src/symbol/wye.js
var s2 = sqrt(3) / 2;
var k = 1 / sqrt(12);
var a2 = (k / 2 + 1) * 3;

// node_modules/d3-shape/src/noop.js
function noop_default() {
}

// node_modules/d3-shape/src/curve/basis.js
function point(that, x3, y5) {
  that._context.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x3) / 6,
    (that._y0 + 4 * that._y1 + y5) / 6
  );
}
function Basis(context) {
  this._context = context;
}
Basis.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 3:
        point(this, this._x1, this._y1);
      // falls through
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x3, y5) : this._context.moveTo(x3, y5);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6);
      // falls through
      default:
        point(this, x3, y5);
        break;
    }
    this._x0 = this._x1, this._x1 = x3;
    this._y0 = this._y1, this._y1 = y5;
  }
};
function basis_default2(context) {
  return new Basis(context);
}

// node_modules/d3-shape/src/curve/basisClosed.js
function BasisClosed(context) {
  this._context = context;
}
BasisClosed.prototype = {
  areaStart: noop_default,
  areaEnd: noop_default,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x2, this._y2);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
        this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x2, this._y2);
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        break;
      }
    }
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x2 = x3, this._y2 = y5;
        break;
      case 1:
        this._point = 2;
        this._x3 = x3, this._y3 = y5;
        break;
      case 2:
        this._point = 3;
        this._x4 = x3, this._y4 = y5;
        this._context.moveTo((this._x0 + 4 * this._x1 + x3) / 6, (this._y0 + 4 * this._y1 + y5) / 6);
        break;
      default:
        point(this, x3, y5);
        break;
    }
    this._x0 = this._x1, this._x1 = x3;
    this._y0 = this._y1, this._y1 = y5;
  }
};
function basisClosed_default2(context) {
  return new BasisClosed(context);
}

// node_modules/d3-shape/src/curve/basisOpen.js
function BasisOpen(context) {
  this._context = context;
}
BasisOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        var x0 = (this._x0 + 4 * this._x1 + x3) / 6, y0 = (this._y0 + 4 * this._y1 + y5) / 6;
        this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0);
        break;
      case 3:
        this._point = 4;
      // falls through
      default:
        point(this, x3, y5);
        break;
    }
    this._x0 = this._x1, this._x1 = x3;
    this._y0 = this._y1, this._y1 = y5;
  }
};
function basisOpen_default(context) {
  return new BasisOpen(context);
}

// node_modules/d3-shape/src/curve/bundle.js
function Bundle(context, beta) {
  this._basis = new Basis(context);
  this._beta = beta;
}
Bundle.prototype = {
  lineStart: function() {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function() {
    var x3 = this._x, y5 = this._y, j5 = x3.length - 1;
    if (j5 > 0) {
      var x0 = x3[0], y0 = y5[0], dx = x3[j5] - x0, dy = y5[j5] - y0, i7 = -1, t9;
      while (++i7 <= j5) {
        t9 = i7 / j5;
        this._basis.point(
          this._beta * x3[i7] + (1 - this._beta) * (x0 + t9 * dx),
          this._beta * y5[i7] + (1 - this._beta) * (y0 + t9 * dy)
        );
      }
    }
    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function(x3, y5) {
    this._x.push(+x3);
    this._y.push(+y5);
  }
};
var bundle_default = (function custom(beta) {
  function bundle(context) {
    return beta === 1 ? new Basis(context) : new Bundle(context, beta);
  }
  bundle.beta = function(beta2) {
    return custom(+beta2);
  };
  return bundle;
})(0.85);

// node_modules/d3-shape/src/curve/cardinal.js
function point2(that, x3, y5) {
  that._context.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x3),
    that._y2 + that._k * (that._y1 - y5),
    that._x2,
    that._y2
  );
}
function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
Cardinal.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        point2(this, this._x1, this._y1);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x3, y5) : this._context.moveTo(x3, y5);
        break;
      case 1:
        this._point = 2;
        this._x1 = x3, this._y1 = y5;
        break;
      case 2:
        this._point = 3;
      // falls through
      default:
        point2(this, x3, y5);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y5;
  }
};
var cardinal_default = (function custom2(tension) {
  function cardinal(context) {
    return new Cardinal(context, tension);
  }
  cardinal.tension = function(tension2) {
    return custom2(+tension2);
  };
  return cardinal;
})(0);

// node_modules/d3-shape/src/curve/cardinalClosed.js
function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
CardinalClosed.prototype = {
  areaStart: noop_default,
  areaEnd: noop_default,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x3 = x3, this._y3 = y5;
        break;
      case 1:
        this._point = 2;
        this._context.moveTo(this._x4 = x3, this._y4 = y5);
        break;
      case 2:
        this._point = 3;
        this._x5 = x3, this._y5 = y5;
        break;
      default:
        point2(this, x3, y5);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y5;
  }
};
var cardinalClosed_default = (function custom3(tension) {
  function cardinal(context) {
    return new CardinalClosed(context, tension);
  }
  cardinal.tension = function(tension2) {
    return custom3(+tension2);
  };
  return cardinal;
})(0);

// node_modules/d3-shape/src/curve/cardinalOpen.js
function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
CardinalOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
        break;
      case 3:
        this._point = 4;
      // falls through
      default:
        point2(this, x3, y5);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y5;
  }
};
var cardinalOpen_default = (function custom4(tension) {
  function cardinal(context) {
    return new CardinalOpen(context, tension);
  }
  cardinal.tension = function(tension2) {
    return custom4(+tension2);
  };
  return cardinal;
})(0);

// node_modules/d3-shape/src/curve/catmullRom.js
function point3(that, x3, y5) {
  var x1 = that._x1, y1 = that._y1, x22 = that._x2, y22 = that._y2;
  if (that._l01_a > epsilon) {
    var a6 = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a, n8 = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a6 - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n8;
    y1 = (y1 * a6 - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n8;
  }
  if (that._l23_a > epsilon) {
    var b6 = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a, m3 = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x22 = (x22 * b6 + that._x1 * that._l23_2a - x3 * that._l12_2a) / m3;
    y22 = (y22 * b6 + that._y1 * that._l23_2a - y5 * that._l12_2a) / m3;
  }
  that._context.bezierCurveTo(x1, y1, x22, y22, that._x2, that._y2);
}
function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRom.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        this.point(this._x2, this._y2);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    if (this._point) {
      var x23 = this._x2 - x3, y23 = this._y2 - y5;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x3, y5) : this._context.moveTo(x3, y5);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
      // falls through
      default:
        point3(this, x3, y5);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y5;
  }
};
var catmullRom_default = (function custom5(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
  }
  catmullRom.alpha = function(alpha2) {
    return custom5(+alpha2);
  };
  return catmullRom;
})(0.5);

// node_modules/d3-shape/src/curve/catmullRomClosed.js
function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRomClosed.prototype = {
  areaStart: noop_default,
  areaEnd: noop_default,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    if (this._point) {
      var x23 = this._x2 - x3, y23 = this._y2 - y5;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x3 = x3, this._y3 = y5;
        break;
      case 1:
        this._point = 2;
        this._context.moveTo(this._x4 = x3, this._y4 = y5);
        break;
      case 2:
        this._point = 3;
        this._x5 = x3, this._y5 = y5;
        break;
      default:
        point3(this, x3, y5);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y5;
  }
};
var catmullRomClosed_default = (function custom6(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
  }
  catmullRom.alpha = function(alpha2) {
    return custom6(+alpha2);
  };
  return catmullRom;
})(0.5);

// node_modules/d3-shape/src/curve/catmullRomOpen.js
function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRomOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    if (this._point) {
      var x23 = this._x2 - x3, y23 = this._y2 - y5;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
        break;
      case 3:
        this._point = 4;
      // falls through
      default:
        point3(this, x3, y5);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y5;
  }
};
var catmullRomOpen_default = (function custom7(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
  }
  catmullRom.alpha = function(alpha2) {
    return custom7(+alpha2);
  };
  return catmullRom;
})(0.5);

// node_modules/d3-shape/src/curve/linearClosed.js
function LinearClosed(context) {
  this._context = context;
}
LinearClosed.prototype = {
  areaStart: noop_default,
  areaEnd: noop_default,
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._point) this._context.closePath();
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    if (this._point) this._context.lineTo(x3, y5);
    else this._point = 1, this._context.moveTo(x3, y5);
  }
};
function linearClosed_default(context) {
  return new LinearClosed(context);
}

// node_modules/d3-shape/src/curve/monotone.js
function sign(x3) {
  return x3 < 0 ? -1 : 1;
}
function slope3(that, x22, y22) {
  var h0 = that._x1 - that._x0, h1 = x22 - that._x1, s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0), s1 = (y22 - that._y1) / (h1 || h0 < 0 && -0), p4 = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p4)) || 0;
}
function slope2(that, t9) {
  var h2 = that._x1 - that._x0;
  return h2 ? (3 * (that._y1 - that._y0) / h2 - t9) / 2 : t9;
}
function point4(that, t04, t14) {
  var x0 = that._x0, y0 = that._y0, x1 = that._x1, y1 = that._y1, dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t04, x1 - dx, y1 - dx * t14, x1, y1);
}
function MonotoneX(context) {
  this._context = context;
}
MonotoneX.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
      case 3:
        point4(this, this._t0, slope2(this, this._t0));
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x3, y5) {
    var t14 = NaN;
    x3 = +x3, y5 = +y5;
    if (x3 === this._x1 && y5 === this._y1) return;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x3, y5) : this._context.moveTo(x3, y5);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        point4(this, slope2(this, t14 = slope3(this, x3, y5)), t14);
        break;
      default:
        point4(this, this._t0, t14 = slope3(this, x3, y5));
        break;
    }
    this._x0 = this._x1, this._x1 = x3;
    this._y0 = this._y1, this._y1 = y5;
    this._t0 = t14;
  }
};
function MonotoneY(context) {
  this._context = new ReflectContext(context);
}
(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x3, y5) {
  MonotoneX.prototype.point.call(this, y5, x3);
};
function ReflectContext(context) {
  this._context = context;
}
ReflectContext.prototype = {
  moveTo: function(x3, y5) {
    this._context.moveTo(y5, x3);
  },
  closePath: function() {
    this._context.closePath();
  },
  lineTo: function(x3, y5) {
    this._context.lineTo(y5, x3);
  },
  bezierCurveTo: function(x1, y1, x22, y22, x3, y5) {
    this._context.bezierCurveTo(y1, x1, y22, x22, y5, x3);
  }
};
function monotoneX(context) {
  return new MonotoneX(context);
}
function monotoneY(context) {
  return new MonotoneY(context);
}

// node_modules/d3-shape/src/curve/natural.js
function Natural(context) {
  this._context = context;
}
Natural.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = [];
    this._y = [];
  },
  lineEnd: function() {
    var x3 = this._x, y5 = this._y, n8 = x3.length;
    if (n8) {
      this._line ? this._context.lineTo(x3[0], y5[0]) : this._context.moveTo(x3[0], y5[0]);
      if (n8 === 2) {
        this._context.lineTo(x3[1], y5[1]);
      } else {
        var px = controlPoints(x3), py = controlPoints(y5);
        for (var i0 = 0, i1 = 1; i1 < n8; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x3[i1], y5[i1]);
        }
      }
    }
    if (this._line || this._line !== 0 && n8 === 1) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function(x3, y5) {
    this._x.push(+x3);
    this._y.push(+y5);
  }
};
function controlPoints(x3) {
  var i7, n8 = x3.length - 1, m3, a6 = new Array(n8), b6 = new Array(n8), r7 = new Array(n8);
  a6[0] = 0, b6[0] = 2, r7[0] = x3[0] + 2 * x3[1];
  for (i7 = 1; i7 < n8 - 1; ++i7) a6[i7] = 1, b6[i7] = 4, r7[i7] = 4 * x3[i7] + 2 * x3[i7 + 1];
  a6[n8 - 1] = 2, b6[n8 - 1] = 7, r7[n8 - 1] = 8 * x3[n8 - 1] + x3[n8];
  for (i7 = 1; i7 < n8; ++i7) m3 = a6[i7] / b6[i7 - 1], b6[i7] -= m3, r7[i7] -= m3 * r7[i7 - 1];
  a6[n8 - 1] = r7[n8 - 1] / b6[n8 - 1];
  for (i7 = n8 - 2; i7 >= 0; --i7) a6[i7] = (r7[i7] - a6[i7 + 1]) / b6[i7];
  b6[n8 - 1] = (x3[n8] + a6[n8 - 1]) / 2;
  for (i7 = 0; i7 < n8 - 1; ++i7) b6[i7] = 2 * x3[i7 + 1] - a6[i7 + 1];
  return [a6, b6];
}
function natural_default(context) {
  return new Natural(context);
}

// node_modules/d3-shape/src/curve/step.js
function Step(context, t9) {
  this._context = context;
  this._t = t9;
}
Step.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function(x3, y5) {
    x3 = +x3, y5 = +y5;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x3, y5) : this._context.moveTo(x3, y5);
        break;
      case 1:
        this._point = 2;
      // falls through
      default: {
        if (this._t <= 0) {
          this._context.lineTo(this._x, y5);
          this._context.lineTo(x3, y5);
        } else {
          var x1 = this._x * (1 - this._t) + x3 * this._t;
          this._context.lineTo(x1, this._y);
          this._context.lineTo(x1, y5);
        }
        break;
      }
    }
    this._x = x3, this._y = y5;
  }
};
function step_default(context) {
  return new Step(context, 0.5);
}
function stepBefore(context) {
  return new Step(context, 0);
}
function stepAfter(context) {
  return new Step(context, 1);
}

// node_modules/d3-shape/src/offset/none.js
function none_default(series, order) {
  if (!((n8 = series.length) > 1)) return;
  for (var i7 = 1, j5, s0, s1 = series[order[0]], n8, m3 = s1.length; i7 < n8; ++i7) {
    s0 = s1, s1 = series[order[i7]];
    for (j5 = 0; j5 < m3; ++j5) {
      s1[j5][1] += s1[j5][0] = isNaN(s0[j5][1]) ? s0[j5][0] : s0[j5][1];
    }
  }
}

// node_modules/d3-shape/src/order/none.js
function none_default2(series) {
  var n8 = series.length, o5 = new Array(n8);
  while (--n8 >= 0) o5[n8] = n8;
  return o5;
}

// node_modules/d3-shape/src/stack.js
function stackValue(d5, key) {
  return d5[key];
}
function stackSeries(key) {
  const series = [];
  series.key = key;
  return series;
}
function stack_default() {
  var keys = constant_default2([]), order = none_default2, offset = none_default, value = stackValue;
  function stack(data) {
    var sz = Array.from(keys.apply(this, arguments), stackSeries), i7, n8 = sz.length, j5 = -1, oz;
    for (const d5 of data) {
      for (i7 = 0, ++j5; i7 < n8; ++i7) {
        (sz[i7][j5] = [0, +value(d5, sz[i7].key, j5, data)]).data = d5;
      }
    }
    for (i7 = 0, oz = array_default2(order(sz)); i7 < n8; ++i7) {
      sz[oz[i7]].index = i7;
    }
    offset(sz, oz);
    return sz;
  }
  stack.keys = function(_3) {
    return arguments.length ? (keys = typeof _3 === "function" ? _3 : constant_default2(Array.from(_3)), stack) : keys;
  };
  stack.value = function(_3) {
    return arguments.length ? (value = typeof _3 === "function" ? _3 : constant_default2(+_3), stack) : value;
  };
  stack.order = function(_3) {
    return arguments.length ? (order = _3 == null ? none_default2 : typeof _3 === "function" ? _3 : constant_default2(Array.from(_3)), stack) : order;
  };
  stack.offset = function(_3) {
    return arguments.length ? (offset = _3 == null ? none_default : _3, stack) : offset;
  };
  return stack;
}

// node_modules/d3-shape/src/offset/expand.js
function expand_default(series, order) {
  if (!((n8 = series.length) > 0)) return;
  for (var i7, n8, j5 = 0, m3 = series[0].length, y5; j5 < m3; ++j5) {
    for (y5 = i7 = 0; i7 < n8; ++i7) y5 += series[i7][j5][1] || 0;
    if (y5) for (i7 = 0; i7 < n8; ++i7) series[i7][j5][1] /= y5;
  }
  none_default(series, order);
}

// node_modules/d3-shape/src/offset/diverging.js
function diverging_default(series, order) {
  if (!((n8 = series.length) > 0)) return;
  for (var i7, j5 = 0, d5, dy, yp, yn3, n8, m3 = series[order[0]].length; j5 < m3; ++j5) {
    for (yp = yn3 = 0, i7 = 0; i7 < n8; ++i7) {
      if ((dy = (d5 = series[order[i7]][j5])[1] - d5[0]) > 0) {
        d5[0] = yp, d5[1] = yp += dy;
      } else if (dy < 0) {
        d5[1] = yn3, d5[0] = yn3 += dy;
      } else {
        d5[0] = 0, d5[1] = dy;
      }
    }
  }
}

// node_modules/d3-shape/src/offset/silhouette.js
function silhouette_default(series, order) {
  if (!((n8 = series.length) > 0)) return;
  for (var j5 = 0, s0 = series[order[0]], n8, m3 = s0.length; j5 < m3; ++j5) {
    for (var i7 = 0, y5 = 0; i7 < n8; ++i7) y5 += series[i7][j5][1] || 0;
    s0[j5][1] += s0[j5][0] = -y5 / 2;
  }
  none_default(series, order);
}

// node_modules/d3-shape/src/offset/wiggle.js
function wiggle_default(series, order) {
  if (!((n8 = series.length) > 0) || !((m3 = (s0 = series[order[0]]).length) > 0)) return;
  for (var y5 = 0, j5 = 1, s0, m3, n8; j5 < m3; ++j5) {
    for (var i7 = 0, s1 = 0, s22 = 0; i7 < n8; ++i7) {
      var si = series[order[i7]], sij0 = si[j5][1] || 0, sij1 = si[j5 - 1][1] || 0, s32 = (sij0 - sij1) / 2;
      for (var k4 = 0; k4 < i7; ++k4) {
        var sk = series[order[k4]], skj0 = sk[j5][1] || 0, skj1 = sk[j5 - 1][1] || 0;
        s32 += skj0 - skj1;
      }
      s1 += sij0, s22 += s32 * sij0;
    }
    s0[j5 - 1][1] += s0[j5 - 1][0] = y5;
    if (s1) y5 -= s22 / s1;
  }
  s0[j5 - 1][1] += s0[j5 - 1][0] = y5;
  none_default(series, order);
}

// node_modules/d3-shape/src/order/appearance.js
function appearance_default(series) {
  var peaks = series.map(peak);
  return none_default2(series).sort(function(a6, b6) {
    return peaks[a6] - peaks[b6];
  });
}
function peak(series) {
  var i7 = -1, j5 = 0, n8 = series.length, vi, vj = -Infinity;
  while (++i7 < n8) if ((vi = +series[i7][1]) > vj) vj = vi, j5 = i7;
  return j5;
}

// node_modules/d3-shape/src/order/ascending.js
function ascending_default(series) {
  var sums = series.map(sum);
  return none_default2(series).sort(function(a6, b6) {
    return sums[a6] - sums[b6];
  });
}
function sum(series) {
  var s6 = 0, i7 = -1, n8 = series.length, v3;
  while (++i7 < n8) if (v3 = +series[i7][1]) s6 += v3;
  return s6;
}

// node_modules/d3-shape/src/order/descending.js
function descending_default2(series) {
  return ascending_default(series).reverse();
}

// node_modules/d3-shape/src/order/insideOut.js
function insideOut_default(series) {
  var n8 = series.length, i7, j5, sums = series.map(sum), order = appearance_default(series), top = 0, bottom = 0, tops = [], bottoms = [];
  for (i7 = 0; i7 < n8; ++i7) {
    j5 = order[i7];
    if (top < bottom) {
      top += sums[j5];
      tops.push(j5);
    } else {
      bottom += sums[j5];
      bottoms.push(j5);
    }
  }
  return bottoms.reverse().concat(tops);
}

// node_modules/d3-shape/src/order/reverse.js
function reverse_default(series) {
  return none_default2(series).reverse();
}

// node_modules/d3-array/src/ascending.js
function ascending(a6, b6) {
  return a6 == null || b6 == null ? NaN : a6 < b6 ? -1 : a6 > b6 ? 1 : a6 >= b6 ? 0 : NaN;
}

// node_modules/d3-array/src/descending.js
function descending(a6, b6) {
  return a6 == null || b6 == null ? NaN : b6 < a6 ? -1 : b6 > a6 ? 1 : b6 >= a6 ? 0 : NaN;
}

// node_modules/d3-array/src/bisector.js
function bisector(f2) {
  let compare1, compare2, delta;
  if (f2.length !== 2) {
    compare1 = ascending;
    compare2 = (d5, x3) => ascending(f2(d5), x3);
    delta = (d5, x3) => f2(d5) - x3;
  } else {
    compare1 = f2 === ascending || f2 === descending ? f2 : zero2;
    compare2 = f2;
    delta = f2;
  }
  function left(a6, x3, lo = 0, hi = a6.length) {
    if (lo < hi) {
      if (compare1(x3, x3) !== 0) return hi;
      do {
        const mid = lo + hi >>> 1;
        if (compare2(a6[mid], x3) < 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function right(a6, x3, lo = 0, hi = a6.length) {
    if (lo < hi) {
      if (compare1(x3, x3) !== 0) return hi;
      do {
        const mid = lo + hi >>> 1;
        if (compare2(a6[mid], x3) <= 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function center(a6, x3, lo = 0, hi = a6.length) {
    const i7 = left(a6, x3, lo, hi - 1);
    return i7 > lo && delta(a6[i7 - 1], x3) > -delta(a6[i7], x3) ? i7 - 1 : i7;
  }
  return { left, center, right };
}
function zero2() {
  return 0;
}

// node_modules/d3-array/src/number.js
function number(x3) {
  return x3 === null ? NaN : +x3;
}

// node_modules/d3-array/src/bisect.js
var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;
var bisectLeft = ascendingBisect.left;
var bisectCenter = bisector(number).center;
var bisect_default = bisectRight;

// node_modules/d3-array/src/blur.js
var blur2 = Blur2(blurf);
var blurImage = Blur2(blurfImage);
function Blur2(blur3) {
  return function(data, rx, ry = rx) {
    if (!((rx = +rx) >= 0)) throw new RangeError("invalid rx");
    if (!((ry = +ry) >= 0)) throw new RangeError("invalid ry");
    let { data: values, width, height } = data;
    if (!((width = Math.floor(width)) >= 0)) throw new RangeError("invalid width");
    if (!((height = Math.floor(height !== void 0 ? height : values.length / width)) >= 0)) throw new RangeError("invalid height");
    if (!width || !height || !rx && !ry) return data;
    const blurx = rx && blur3(rx);
    const blury = ry && blur3(ry);
    const temp = values.slice();
    if (blurx && blury) {
      blurh(blurx, temp, values, width, height);
      blurh(blurx, values, temp, width, height);
      blurh(blurx, temp, values, width, height);
      blurv(blury, values, temp, width, height);
      blurv(blury, temp, values, width, height);
      blurv(blury, values, temp, width, height);
    } else if (blurx) {
      blurh(blurx, values, temp, width, height);
      blurh(blurx, temp, values, width, height);
      blurh(blurx, values, temp, width, height);
    } else if (blury) {
      blurv(blury, values, temp, width, height);
      blurv(blury, temp, values, width, height);
      blurv(blury, values, temp, width, height);
    }
    return data;
  };
}
function blurh(blur3, T3, S4, w4, h2) {
  for (let y5 = 0, n8 = w4 * h2; y5 < n8; ) {
    blur3(T3, S4, y5, y5 += w4, 1);
  }
}
function blurv(blur3, T3, S4, w4, h2) {
  for (let x3 = 0, n8 = w4 * h2; x3 < w4; ++x3) {
    blur3(T3, S4, x3, x3 + n8, w4);
  }
}
function blurfImage(radius) {
  const blur3 = blurf(radius);
  return (T3, S4, start2, stop2, step) => {
    start2 <<= 2, stop2 <<= 2, step <<= 2;
    blur3(T3, S4, start2 + 0, stop2 + 0, step);
    blur3(T3, S4, start2 + 1, stop2 + 1, step);
    blur3(T3, S4, start2 + 2, stop2 + 2, step);
    blur3(T3, S4, start2 + 3, stop2 + 3, step);
  };
}
function blurf(radius) {
  const radius0 = Math.floor(radius);
  if (radius0 === radius) return bluri(radius);
  const t9 = radius - radius0;
  const w4 = 2 * radius + 1;
  return (T3, S4, start2, stop2, step) => {
    if (!((stop2 -= step) >= start2)) return;
    let sum3 = radius0 * S4[start2];
    const s0 = step * radius0;
    const s1 = s0 + step;
    for (let i7 = start2, j5 = start2 + s0; i7 < j5; i7 += step) {
      sum3 += S4[Math.min(stop2, i7)];
    }
    for (let i7 = start2, j5 = stop2; i7 <= j5; i7 += step) {
      sum3 += S4[Math.min(stop2, i7 + s0)];
      T3[i7] = (sum3 + t9 * (S4[Math.max(start2, i7 - s1)] + S4[Math.min(stop2, i7 + s1)])) / w4;
      sum3 -= S4[Math.max(start2, i7 - s0)];
    }
  };
}
function bluri(radius) {
  const w4 = 2 * radius + 1;
  return (T3, S4, start2, stop2, step) => {
    if (!((stop2 -= step) >= start2)) return;
    let sum3 = radius * S4[start2];
    const s6 = step * radius;
    for (let i7 = start2, j5 = start2 + s6; i7 < j5; i7 += step) {
      sum3 += S4[Math.min(stop2, i7)];
    }
    for (let i7 = start2, j5 = stop2; i7 <= j5; i7 += step) {
      sum3 += S4[Math.min(stop2, i7 + s6)];
      T3[i7] = sum3 / w4;
      sum3 -= S4[Math.max(start2, i7 - s6)];
    }
  };
}

// node_modules/internmap/src/index.js
var InternMap = class extends Map {
  constructor(entries, key = keyof) {
    super();
    Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: key } });
    if (entries != null) for (const [key2, value] of entries) this.set(key2, value);
  }
  get(key) {
    return super.get(intern_get(this, key));
  }
  has(key) {
    return super.has(intern_get(this, key));
  }
  set(key, value) {
    return super.set(intern_set(this, key), value);
  }
  delete(key) {
    return super.delete(intern_delete(this, key));
  }
};
function intern_get({ _intern, _key }, value) {
  const key = _key(value);
  return _intern.has(key) ? _intern.get(key) : value;
}
function intern_set({ _intern, _key }, value) {
  const key = _key(value);
  if (_intern.has(key)) return _intern.get(key);
  _intern.set(key, value);
  return value;
}
function intern_delete({ _intern, _key }, value) {
  const key = _key(value);
  if (_intern.has(key)) {
    value = _intern.get(key);
    _intern.delete(key);
  }
  return value;
}
function keyof(value) {
  return value !== null && typeof value === "object" ? value.valueOf() : value;
}

// node_modules/d3-array/src/array.js
var array = Array.prototype;
var slice2 = array.slice;
var map = array.map;

// node_modules/d3-array/src/ticks.js
var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e22 = Math.sqrt(2);
function tickSpec(start2, stop2, count2) {
  const step = (stop2 - start2) / Math.max(0, count2), power = Math.floor(Math.log10(step)), error = step / Math.pow(10, power), factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e22 ? 2 : 1;
  let i1, i22, inc;
  if (power < 0) {
    inc = Math.pow(10, -power) / factor;
    i1 = Math.round(start2 * inc);
    i22 = Math.round(stop2 * inc);
    if (i1 / inc < start2) ++i1;
    if (i22 / inc > stop2) --i22;
    inc = -inc;
  } else {
    inc = Math.pow(10, power) * factor;
    i1 = Math.round(start2 / inc);
    i22 = Math.round(stop2 / inc);
    if (i1 * inc < start2) ++i1;
    if (i22 * inc > stop2) --i22;
  }
  if (i22 < i1 && 0.5 <= count2 && count2 < 2) return tickSpec(start2, stop2, count2 * 2);
  return [i1, i22, inc];
}
function ticks(start2, stop2, count2) {
  stop2 = +stop2, start2 = +start2, count2 = +count2;
  if (!(count2 > 0)) return [];
  if (start2 === stop2) return [start2];
  const reverse2 = stop2 < start2, [i1, i22, inc] = reverse2 ? tickSpec(stop2, start2, count2) : tickSpec(start2, stop2, count2);
  if (!(i22 >= i1)) return [];
  const n8 = i22 - i1 + 1, ticks2 = new Array(n8);
  if (reverse2) {
    if (inc < 0) for (let i7 = 0; i7 < n8; ++i7) ticks2[i7] = (i22 - i7) / -inc;
    else for (let i7 = 0; i7 < n8; ++i7) ticks2[i7] = (i22 - i7) * inc;
  } else {
    if (inc < 0) for (let i7 = 0; i7 < n8; ++i7) ticks2[i7] = (i1 + i7) / -inc;
    else for (let i7 = 0; i7 < n8; ++i7) ticks2[i7] = (i1 + i7) * inc;
  }
  return ticks2;
}
function tickIncrement(start2, stop2, count2) {
  stop2 = +stop2, start2 = +start2, count2 = +count2;
  return tickSpec(start2, stop2, count2)[2];
}
function tickStep(start2, stop2, count2) {
  stop2 = +stop2, start2 = +start2, count2 = +count2;
  const reverse2 = stop2 < start2, inc = reverse2 ? tickIncrement(stop2, start2, count2) : tickIncrement(start2, stop2, count2);
  return (reverse2 ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
}

// node_modules/d3-array/src/range.js
function range(start2, stop2, step) {
  start2 = +start2, stop2 = +stop2, step = (n8 = arguments.length) < 2 ? (stop2 = start2, start2 = 0, 1) : n8 < 3 ? 1 : +step;
  var i7 = -1, n8 = Math.max(0, Math.ceil((stop2 - start2) / step)) | 0, range2 = new Array(n8);
  while (++i7 < n8) {
    range2[i7] = start2 + i7 * step;
  }
  return range2;
}

// node_modules/d3-array/src/shuffle.js
var shuffle_default = shuffler(Math.random);
function shuffler(random) {
  return function shuffle(array2, i0 = 0, i1 = array2.length) {
    let m3 = i1 - (i0 = +i0);
    while (m3) {
      const i7 = random() * m3-- | 0, t9 = array2[m3 + i0];
      array2[m3 + i0] = array2[i7 + i0];
      array2[i7 + i0] = t9;
    }
    return array2;
  };
}

// node_modules/d3-scale/src/init.js
function initRange(domain, range2) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      this.range(domain);
      break;
    default:
      this.range(range2).domain(domain);
      break;
  }
  return this;
}

// node_modules/d3-scale/src/ordinal.js
var implicit = Symbol("implicit");
function ordinal() {
  var index2 = new InternMap(), domain = [], range2 = [], unknown = implicit;
  function scale(d5) {
    let i7 = index2.get(d5);
    if (i7 === void 0) {
      if (unknown !== implicit) return unknown;
      index2.set(d5, i7 = domain.push(d5) - 1);
    }
    return range2[i7 % range2.length];
  }
  scale.domain = function(_3) {
    if (!arguments.length) return domain.slice();
    domain = [], index2 = new InternMap();
    for (const value of _3) {
      if (index2.has(value)) continue;
      index2.set(value, domain.push(value) - 1);
    }
    return scale;
  };
  scale.range = function(_3) {
    return arguments.length ? (range2 = Array.from(_3), scale) : range2.slice();
  };
  scale.unknown = function(_3) {
    return arguments.length ? (unknown = _3, scale) : unknown;
  };
  scale.copy = function() {
    return ordinal(domain, range2).unknown(unknown);
  };
  initRange.apply(scale, arguments);
  return scale;
}

// node_modules/d3-scale/src/band.js
function band() {
  var scale = ordinal().unknown(void 0), domain = scale.domain, ordinalRange = scale.range, r0 = 0, r1 = 1, step, bandwidth, round = false, paddingInner = 0, paddingOuter = 0, align = 0.5;
  delete scale.unknown;
  function rescale() {
    var n8 = domain().length, reverse2 = r1 < r0, start2 = reverse2 ? r1 : r0, stop2 = reverse2 ? r0 : r1;
    step = (stop2 - start2) / Math.max(1, n8 - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start2 += (stop2 - start2 - step * (n8 - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start2 = Math.round(start2), bandwidth = Math.round(bandwidth);
    var values = range(n8).map(function(i7) {
      return start2 + step * i7;
    });
    return ordinalRange(reverse2 ? values.reverse() : values);
  }
  scale.domain = function(_3) {
    return arguments.length ? (domain(_3), rescale()) : domain();
  };
  scale.range = function(_3) {
    return arguments.length ? ([r0, r1] = _3, r0 = +r0, r1 = +r1, rescale()) : [r0, r1];
  };
  scale.rangeRound = function(_3) {
    return [r0, r1] = _3, r0 = +r0, r1 = +r1, round = true, rescale();
  };
  scale.bandwidth = function() {
    return bandwidth;
  };
  scale.step = function() {
    return step;
  };
  scale.round = function(_3) {
    return arguments.length ? (round = !!_3, rescale()) : round;
  };
  scale.padding = function(_3) {
    return arguments.length ? (paddingInner = Math.min(1, paddingOuter = +_3), rescale()) : paddingInner;
  };
  scale.paddingInner = function(_3) {
    return arguments.length ? (paddingInner = Math.min(1, _3), rescale()) : paddingInner;
  };
  scale.paddingOuter = function(_3) {
    return arguments.length ? (paddingOuter = +_3, rescale()) : paddingOuter;
  };
  scale.align = function(_3) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _3)), rescale()) : align;
  };
  scale.copy = function() {
    return band(domain(), [r0, r1]).round(round).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  };
  return initRange.apply(rescale(), arguments);
}
function pointish(scale) {
  var copy3 = scale.copy;
  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;
  scale.copy = function() {
    return pointish(copy3());
  };
  return scale;
}
function point5() {
  return pointish(band.apply(null, arguments).paddingInner(1));
}

// node_modules/d3-scale/src/constant.js
function constants(x3) {
  return function() {
    return x3;
  };
}

// node_modules/d3-scale/src/number.js
function number2(x3) {
  return +x3;
}

// node_modules/d3-scale/src/continuous.js
var unit = [0, 1];
function identity3(x3) {
  return x3;
}
function normalize(a6, b6) {
  return (b6 -= a6 = +a6) ? function(x3) {
    return (x3 - a6) / b6;
  } : constants(isNaN(b6) ? NaN : 0.5);
}
function clamper(a6, b6) {
  var t9;
  if (a6 > b6) t9 = a6, a6 = b6, b6 = t9;
  return function(x3) {
    return Math.max(a6, Math.min(b6, x3));
  };
}
function bimap(domain, range2, interpolate2) {
  var d0 = domain[0], d1 = domain[1], r0 = range2[0], r1 = range2[1];
  if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate2(r1, r0);
  else d0 = normalize(d0, d1), r0 = interpolate2(r0, r1);
  return function(x3) {
    return r0(d0(x3));
  };
}
function polymap(domain, range2, interpolate2) {
  var j5 = Math.min(domain.length, range2.length) - 1, d5 = new Array(j5), r7 = new Array(j5), i7 = -1;
  if (domain[j5] < domain[0]) {
    domain = domain.slice().reverse();
    range2 = range2.slice().reverse();
  }
  while (++i7 < j5) {
    d5[i7] = normalize(domain[i7], domain[i7 + 1]);
    r7[i7] = interpolate2(range2[i7], range2[i7 + 1]);
  }
  return function(x3) {
    var i8 = bisect_default(domain, x3, 1, j5) - 1;
    return r7[i8](d5[i8](x3));
  };
}
function copy(source, target) {
  return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp()).unknown(source.unknown());
}
function transformer() {
  var domain = unit, range2 = unit, interpolate2 = value_default, transform, untransform, unknown, clamp2 = identity3, piecewise2, output, input;
  function rescale() {
    var n8 = Math.min(domain.length, range2.length);
    if (clamp2 !== identity3) clamp2 = clamper(domain[0], domain[n8 - 1]);
    piecewise2 = n8 > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }
  function scale(x3) {
    return x3 == null || isNaN(x3 = +x3) ? unknown : (output || (output = piecewise2(domain.map(transform), range2, interpolate2)))(transform(clamp2(x3)));
  }
  scale.invert = function(y5) {
    return clamp2(untransform((input || (input = piecewise2(range2, domain.map(transform), number_default)))(y5)));
  };
  scale.domain = function(_3) {
    return arguments.length ? (domain = Array.from(_3, number2), rescale()) : domain.slice();
  };
  scale.range = function(_3) {
    return arguments.length ? (range2 = Array.from(_3), rescale()) : range2.slice();
  };
  scale.rangeRound = function(_3) {
    return range2 = Array.from(_3), interpolate2 = round_default, rescale();
  };
  scale.clamp = function(_3) {
    return arguments.length ? (clamp2 = _3 ? true : identity3, rescale()) : clamp2 !== identity3;
  };
  scale.interpolate = function(_3) {
    return arguments.length ? (interpolate2 = _3, rescale()) : interpolate2;
  };
  scale.unknown = function(_3) {
    return arguments.length ? (unknown = _3, scale) : unknown;
  };
  return function(t9, u5) {
    transform = t9, untransform = u5;
    return rescale();
  };
}
function continuous() {
  return transformer()(identity3, identity3);
}

// node_modules/d3-format/src/formatDecimal.js
function formatDecimal_default(x3) {
  return Math.abs(x3 = Math.round(x3)) >= 1e21 ? x3.toLocaleString("en").replace(/,/g, "") : x3.toString(10);
}
function formatDecimalParts(x3, p4) {
  if ((i7 = (x3 = p4 ? x3.toExponential(p4 - 1) : x3.toExponential()).indexOf("e")) < 0) return null;
  var i7, coefficient = x3.slice(0, i7);
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x3.slice(i7 + 1)
  ];
}

// node_modules/d3-format/src/exponent.js
function exponent_default(x3) {
  return x3 = formatDecimalParts(Math.abs(x3)), x3 ? x3[1] : NaN;
}

// node_modules/d3-format/src/formatGroup.js
function formatGroup_default(grouping, thousands) {
  return function(value, width) {
    var i7 = value.length, t9 = [], j5 = 0, g2 = grouping[0], length = 0;
    while (i7 > 0 && g2 > 0) {
      if (length + g2 + 1 > width) g2 = Math.max(1, width - length);
      t9.push(value.substring(i7 -= g2, i7 + g2));
      if ((length += g2 + 1) > width) break;
      g2 = grouping[j5 = (j5 + 1) % grouping.length];
    }
    return t9.reverse().join(thousands);
  };
}

// node_modules/d3-format/src/formatNumerals.js
function formatNumerals_default(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i7) {
      return numerals[+i7];
    });
  };
}

// node_modules/d3-format/src/formatSpecifier.js
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}
formatSpecifier.prototype = FormatSpecifier.prototype;
function FormatSpecifier(specifier) {
  this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
  this.align = specifier.align === void 0 ? ">" : specifier.align + "";
  this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === void 0 ? void 0 : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === void 0 ? "" : specifier.type + "";
}
FormatSpecifier.prototype.toString = function() {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
};

// node_modules/d3-format/src/formatTrim.js
function formatTrim_default(s6) {
  out: for (var n8 = s6.length, i7 = 1, i0 = -1, i1; i7 < n8; ++i7) {
    switch (s6[i7]) {
      case ".":
        i0 = i1 = i7;
        break;
      case "0":
        if (i0 === 0) i0 = i7;
        i1 = i7;
        break;
      default:
        if (!+s6[i7]) break out;
        if (i0 > 0) i0 = 0;
        break;
    }
  }
  return i0 > 0 ? s6.slice(0, i0) + s6.slice(i1 + 1) : s6;
}

// node_modules/d3-format/src/formatPrefixAuto.js
var prefixExponent;
function formatPrefixAuto_default(x3, p4) {
  var d5 = formatDecimalParts(x3, p4);
  if (!d5) return x3 + "";
  var coefficient = d5[0], exponent = d5[1], i7 = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1, n8 = coefficient.length;
  return i7 === n8 ? coefficient : i7 > n8 ? coefficient + new Array(i7 - n8 + 1).join("0") : i7 > 0 ? coefficient.slice(0, i7) + "." + coefficient.slice(i7) : "0." + new Array(1 - i7).join("0") + formatDecimalParts(x3, Math.max(0, p4 + i7 - 1))[0];
}

// node_modules/d3-format/src/formatRounded.js
function formatRounded_default(x3, p4) {
  var d5 = formatDecimalParts(x3, p4);
  if (!d5) return x3 + "";
  var coefficient = d5[0], exponent = d5[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

// node_modules/d3-format/src/formatTypes.js
var formatTypes_default = {
  "%": function(x3, p4) {
    return (x3 * 100).toFixed(p4);
  },
  "b": function(x3) {
    return Math.round(x3).toString(2);
  },
  "c": function(x3) {
    return x3 + "";
  },
  "d": formatDecimal_default,
  "e": function(x3, p4) {
    return x3.toExponential(p4);
  },
  "f": function(x3, p4) {
    return x3.toFixed(p4);
  },
  "g": function(x3, p4) {
    return x3.toPrecision(p4);
  },
  "o": function(x3) {
    return Math.round(x3).toString(8);
  },
  "p": function(x3, p4) {
    return formatRounded_default(x3 * 100, p4);
  },
  "r": formatRounded_default,
  "s": formatPrefixAuto_default,
  "X": function(x3) {
    return Math.round(x3).toString(16).toUpperCase();
  },
  "x": function(x3) {
    return Math.round(x3).toString(16);
  }
};

// node_modules/d3-format/src/identity.js
function identity_default2(x3) {
  return x3;
}

// node_modules/d3-format/src/locale.js
var map3 = Array.prototype.map;
var prefixes2 = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
function locale_default(locale3) {
  var group2 = locale3.grouping === void 0 || locale3.thousands === void 0 ? identity_default2 : formatGroup_default(map3.call(locale3.grouping, Number), locale3.thousands + ""), currencyPrefix = locale3.currency === void 0 ? "" : locale3.currency[0] + "", currencySuffix = locale3.currency === void 0 ? "" : locale3.currency[1] + "", decimal = locale3.decimal === void 0 ? "." : locale3.decimal + "", numerals = locale3.numerals === void 0 ? identity_default2 : formatNumerals_default(map3.call(locale3.numerals, String)), percent = locale3.percent === void 0 ? "%" : locale3.percent + "", minus = locale3.minus === void 0 ? "-" : locale3.minus + "", nan = locale3.nan === void 0 ? "NaN" : locale3.nan + "";
  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);
    var fill = specifier.fill, align = specifier.align, sign2 = specifier.sign, symbol = specifier.symbol, zero3 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type = specifier.type;
    if (type === "n") comma = true, type = "g";
    else if (!formatTypes_default[type]) precision === void 0 && (precision = 12), trim = true, type = "g";
    if (zero3 || fill === "0" && align === "=") zero3 = true, fill = "0", align = "=";
    var prefix2 = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "", suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";
    var formatType = formatTypes_default[type], maybeSuffix = /[defgprs%]/.test(type);
    precision = precision === void 0 ? 6 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
    function format2(value) {
      var valuePrefix = prefix2, valueSuffix = suffix, i7, n8, c10;
      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;
        var valueNegative = value < 0 || 1 / value < 0;
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
        if (trim) value = formatTrim_default(value);
        if (valueNegative && +value === 0 && sign2 !== "+") valueNegative = false;
        valuePrefix = (valueNegative ? sign2 === "(" ? sign2 : minus : sign2 === "-" || sign2 === "(" ? "" : sign2) + valuePrefix;
        valueSuffix = (type === "s" ? prefixes2[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign2 === "(" ? ")" : "");
        if (maybeSuffix) {
          i7 = -1, n8 = value.length;
          while (++i7 < n8) {
            if (c10 = value.charCodeAt(i7), 48 > c10 || c10 > 57) {
              valueSuffix = (c10 === 46 ? decimal + value.slice(i7 + 1) : value.slice(i7)) + valueSuffix;
              value = value.slice(0, i7);
              break;
            }
          }
        }
      }
      if (comma && !zero3) value = group2(value, Infinity);
      var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
      if (comma && zero3) value = group2(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
      switch (align) {
        case "<":
          value = valuePrefix + value + valueSuffix + padding;
          break;
        case "=":
          value = valuePrefix + padding + value + valueSuffix;
          break;
        case "^":
          value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
          break;
        default:
          value = padding + valuePrefix + value + valueSuffix;
          break;
      }
      return numerals(value);
    }
    format2.toString = function() {
      return specifier + "";
    };
    return format2;
  }
  function formatPrefix2(specifier, value) {
    var f2 = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)), e11 = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k4 = Math.pow(10, -e11), prefix2 = prefixes2[8 + e11 / 3];
    return function(value2) {
      return f2(k4 * value2) + prefix2;
    };
  }
  return {
    format: newFormat,
    formatPrefix: formatPrefix2
  };
}

// node_modules/d3-format/src/defaultLocale.js
var locale;
var format;
var formatPrefix;
defaultLocale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""],
  minus: "-"
});
function defaultLocale(definition) {
  locale = locale_default(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}

// node_modules/d3-format/src/precisionFixed.js
function precisionFixed_default(step) {
  return Math.max(0, -exponent_default(Math.abs(step)));
}

// node_modules/d3-format/src/precisionPrefix.js
function precisionPrefix_default(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3 - exponent_default(Math.abs(step)));
}

// node_modules/d3-format/src/precisionRound.js
function precisionRound_default(step, max3) {
  step = Math.abs(step), max3 = Math.abs(max3) - step;
  return Math.max(0, exponent_default(max3) - exponent_default(step)) + 1;
}

// node_modules/d3-scale/src/tickFormat.js
function tickFormat(start2, stop2, count2, specifier) {
  var step = tickStep(start2, stop2, count2), precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start2), Math.abs(stop2));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix_default(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound_default(step, Math.max(Math.abs(start2), Math.abs(stop2))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed_default(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}

// node_modules/d3-scale/src/linear.js
function linearish(scale) {
  var domain = scale.domain;
  scale.ticks = function(count2) {
    var d5 = domain();
    return ticks(d5[0], d5[d5.length - 1], count2 == null ? 10 : count2);
  };
  scale.tickFormat = function(count2, specifier) {
    var d5 = domain();
    return tickFormat(d5[0], d5[d5.length - 1], count2 == null ? 10 : count2, specifier);
  };
  scale.nice = function(count2) {
    if (count2 == null) count2 = 10;
    var d5 = domain();
    var i0 = 0;
    var i1 = d5.length - 1;
    var start2 = d5[i0];
    var stop2 = d5[i1];
    var prestep;
    var step;
    var maxIter = 10;
    if (stop2 < start2) {
      step = start2, start2 = stop2, stop2 = step;
      step = i0, i0 = i1, i1 = step;
    }
    while (maxIter-- > 0) {
      step = tickIncrement(start2, stop2, count2);
      if (step === prestep) {
        d5[i0] = start2;
        d5[i1] = stop2;
        return domain(d5);
      } else if (step > 0) {
        start2 = Math.floor(start2 / step) * step;
        stop2 = Math.ceil(stop2 / step) * step;
      } else if (step < 0) {
        start2 = Math.ceil(start2 * step) / step;
        stop2 = Math.floor(stop2 * step) / step;
      } else {
        break;
      }
      prestep = step;
    }
    return scale;
  };
  return scale;
}
function linear2() {
  var scale = continuous();
  scale.copy = function() {
    return copy(scale, linear2());
  };
  initRange.apply(scale, arguments);
  return linearish(scale);
}

// node_modules/d3-scale/src/nice.js
function nice2(domain, interval) {
  domain = domain.slice();
  var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], t9;
  if (x1 < x0) {
    t9 = i0, i0 = i1, i1 = t9;
    t9 = x0, x0 = x1, x1 = t9;
  }
  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
}

// node_modules/d3-scale/src/log.js
function transformLog(x3) {
  return Math.log(x3);
}
function transformExp(x3) {
  return Math.exp(x3);
}
function transformLogn(x3) {
  return -Math.log(-x3);
}
function transformExpn(x3) {
  return -Math.exp(-x3);
}
function pow10(x3) {
  return isFinite(x3) ? +("1e" + x3) : x3 < 0 ? 0 : x3;
}
function powp(base) {
  return base === 10 ? pow10 : base === Math.E ? Math.exp : (x3) => Math.pow(base, x3);
}
function logp(base) {
  return base === Math.E ? Math.log : base === 10 && Math.log10 || base === 2 && Math.log2 || (base = Math.log(base), (x3) => Math.log(x3) / base);
}
function reflect(f2) {
  return (x3, k4) => -f2(-x3, k4);
}
function loggish(transform) {
  const scale = transform(transformLog, transformExp);
  const domain = scale.domain;
  let base = 10;
  let logs;
  let pows;
  function rescale() {
    logs = logp(base), pows = powp(base);
    if (domain()[0] < 0) {
      logs = reflect(logs), pows = reflect(pows);
      transform(transformLogn, transformExpn);
    } else {
      transform(transformLog, transformExp);
    }
    return scale;
  }
  scale.base = function(_3) {
    return arguments.length ? (base = +_3, rescale()) : base;
  };
  scale.domain = function(_3) {
    return arguments.length ? (domain(_3), rescale()) : domain();
  };
  scale.ticks = (count2) => {
    const d5 = domain();
    let u5 = d5[0];
    let v3 = d5[d5.length - 1];
    const r7 = v3 < u5;
    if (r7) [u5, v3] = [v3, u5];
    let i7 = logs(u5);
    let j5 = logs(v3);
    let k4;
    let t9;
    const n8 = count2 == null ? 10 : +count2;
    let z6 = [];
    if (!(base % 1) && j5 - i7 < n8) {
      i7 = Math.floor(i7), j5 = Math.ceil(j5);
      if (u5 > 0) for (; i7 <= j5; ++i7) {
        for (k4 = 1; k4 < base; ++k4) {
          t9 = i7 < 0 ? k4 / pows(-i7) : k4 * pows(i7);
          if (t9 < u5) continue;
          if (t9 > v3) break;
          z6.push(t9);
        }
      }
      else for (; i7 <= j5; ++i7) {
        for (k4 = base - 1; k4 >= 1; --k4) {
          t9 = i7 > 0 ? k4 / pows(-i7) : k4 * pows(i7);
          if (t9 < u5) continue;
          if (t9 > v3) break;
          z6.push(t9);
        }
      }
      if (z6.length * 2 < n8) z6 = ticks(u5, v3, n8);
    } else {
      z6 = ticks(i7, j5, Math.min(j5 - i7, n8)).map(pows);
    }
    return r7 ? z6.reverse() : z6;
  };
  scale.tickFormat = (count2, specifier) => {
    if (count2 == null) count2 = 10;
    if (specifier == null) specifier = base === 10 ? "s" : ",";
    if (typeof specifier !== "function") {
      if (!(base % 1) && (specifier = formatSpecifier(specifier)).precision == null) specifier.trim = true;
      specifier = format(specifier);
    }
    if (count2 === Infinity) return specifier;
    const k4 = Math.max(1, base * count2 / scale.ticks().length);
    return (d5) => {
      let i7 = d5 / pows(Math.round(logs(d5)));
      if (i7 * base < base - 0.5) i7 *= base;
      return i7 <= k4 ? specifier(d5) : "";
    };
  };
  scale.nice = () => {
    return domain(nice2(domain(), {
      floor: (x3) => pows(Math.floor(logs(x3))),
      ceil: (x3) => pows(Math.ceil(logs(x3)))
    }));
  };
  return scale;
}
function log() {
  const scale = loggish(transformer()).domain([1, 10]);
  scale.copy = () => copy(scale, log()).base(scale.base());
  initRange.apply(scale, arguments);
  return scale;
}

// node_modules/d3-scale/src/symlog.js
function transformSymlog(c10) {
  return function(x3) {
    return Math.sign(x3) * Math.log1p(Math.abs(x3 / c10));
  };
}
function transformSymexp(c10) {
  return function(x3) {
    return Math.sign(x3) * Math.expm1(Math.abs(x3)) * c10;
  };
}
function symlogish(transform) {
  var c10 = 1, scale = transform(transformSymlog(c10), transformSymexp(c10));
  scale.constant = function(_3) {
    return arguments.length ? transform(transformSymlog(c10 = +_3), transformSymexp(c10)) : c10;
  };
  return linearish(scale);
}
function symlog() {
  var scale = symlogish(transformer());
  scale.copy = function() {
    return copy(scale, symlog()).constant(scale.constant());
  };
  return initRange.apply(scale, arguments);
}

// node_modules/d3-scale/node_modules/d3-time/src/interval.js
var t02 = /* @__PURE__ */ new Date();
var t12 = /* @__PURE__ */ new Date();
function timeInterval(floori, offseti, count2, field) {
  function interval(date2) {
    return floori(date2 = arguments.length === 0 ? /* @__PURE__ */ new Date() : /* @__PURE__ */ new Date(+date2)), date2;
  }
  interval.floor = (date2) => {
    return floori(date2 = /* @__PURE__ */ new Date(+date2)), date2;
  };
  interval.ceil = (date2) => {
    return floori(date2 = new Date(date2 - 1)), offseti(date2, 1), floori(date2), date2;
  };
  interval.round = (date2) => {
    const d0 = interval(date2), d1 = interval.ceil(date2);
    return date2 - d0 < d1 - date2 ? d0 : d1;
  };
  interval.offset = (date2, step) => {
    return offseti(date2 = /* @__PURE__ */ new Date(+date2), step == null ? 1 : Math.floor(step)), date2;
  };
  interval.range = (start2, stop2, step) => {
    const range2 = [];
    start2 = interval.ceil(start2);
    step = step == null ? 1 : Math.floor(step);
    if (!(start2 < stop2) || !(step > 0)) return range2;
    let previous;
    do
      range2.push(previous = /* @__PURE__ */ new Date(+start2)), offseti(start2, step), floori(start2);
    while (previous < start2 && start2 < stop2);
    return range2;
  };
  interval.filter = (test) => {
    return timeInterval((date2) => {
      if (date2 >= date2) while (floori(date2), !test(date2)) date2.setTime(date2 - 1);
    }, (date2, step) => {
      if (date2 >= date2) {
        if (step < 0) while (++step <= 0) {
          while (offseti(date2, -1), !test(date2)) {
          }
        }
        else while (--step >= 0) {
          while (offseti(date2, 1), !test(date2)) {
          }
        }
      }
    });
  };
  if (count2) {
    interval.count = (start2, end) => {
      t02.setTime(+start2), t12.setTime(+end);
      floori(t02), floori(t12);
      return Math.floor(count2(t02, t12));
    };
    interval.every = (step) => {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval : interval.filter(field ? (d5) => field(d5) % step === 0 : (d5) => interval.count(0, d5) % step === 0);
    };
  }
  return interval;
}

// node_modules/d3-scale/node_modules/d3-time/src/millisecond.js
var millisecond = timeInterval(() => {
}, (date2, step) => {
  date2.setTime(+date2 + step);
}, (start2, end) => {
  return end - start2;
});
millisecond.every = (k4) => {
  k4 = Math.floor(k4);
  if (!isFinite(k4) || !(k4 > 0)) return null;
  if (!(k4 > 1)) return millisecond;
  return timeInterval((date2) => {
    date2.setTime(Math.floor(date2 / k4) * k4);
  }, (date2, step) => {
    date2.setTime(+date2 + step * k4);
  }, (start2, end) => {
    return (end - start2) / k4;
  });
};
var milliseconds = millisecond.range;

// node_modules/d3-scale/node_modules/d3-time/src/duration.js
var durationSecond = 1e3;
var durationMinute = durationSecond * 60;
var durationHour = durationMinute * 60;
var durationDay = durationHour * 24;
var durationWeek = durationDay * 7;
var durationMonth = durationDay * 30;
var durationYear = durationDay * 365;

// node_modules/d3-scale/node_modules/d3-time/src/second.js
var second = timeInterval((date2) => {
  date2.setTime(date2 - date2.getMilliseconds());
}, (date2, step) => {
  date2.setTime(+date2 + step * durationSecond);
}, (start2, end) => {
  return (end - start2) / durationSecond;
}, (date2) => {
  return date2.getUTCSeconds();
});
var seconds = second.range;

// node_modules/d3-scale/node_modules/d3-time/src/minute.js
var timeMinute = timeInterval((date2) => {
  date2.setTime(date2 - date2.getMilliseconds() - date2.getSeconds() * durationSecond);
}, (date2, step) => {
  date2.setTime(+date2 + step * durationMinute);
}, (start2, end) => {
  return (end - start2) / durationMinute;
}, (date2) => {
  return date2.getMinutes();
});
var timeMinutes = timeMinute.range;
var utcMinute = timeInterval((date2) => {
  date2.setUTCSeconds(0, 0);
}, (date2, step) => {
  date2.setTime(+date2 + step * durationMinute);
}, (start2, end) => {
  return (end - start2) / durationMinute;
}, (date2) => {
  return date2.getUTCMinutes();
});
var utcMinutes = utcMinute.range;

// node_modules/d3-scale/node_modules/d3-time/src/hour.js
var timeHour = timeInterval((date2) => {
  date2.setTime(date2 - date2.getMilliseconds() - date2.getSeconds() * durationSecond - date2.getMinutes() * durationMinute);
}, (date2, step) => {
  date2.setTime(+date2 + step * durationHour);
}, (start2, end) => {
  return (end - start2) / durationHour;
}, (date2) => {
  return date2.getHours();
});
var timeHours = timeHour.range;
var utcHour = timeInterval((date2) => {
  date2.setUTCMinutes(0, 0, 0);
}, (date2, step) => {
  date2.setTime(+date2 + step * durationHour);
}, (start2, end) => {
  return (end - start2) / durationHour;
}, (date2) => {
  return date2.getUTCHours();
});
var utcHours = utcHour.range;

// node_modules/d3-scale/node_modules/d3-time/src/day.js
var timeDay = timeInterval(
  (date2) => date2.setHours(0, 0, 0, 0),
  (date2, step) => date2.setDate(date2.getDate() + step),
  (start2, end) => (end - start2 - (end.getTimezoneOffset() - start2.getTimezoneOffset()) * durationMinute) / durationDay,
  (date2) => date2.getDate() - 1
);
var timeDays = timeDay.range;
var utcDay = timeInterval((date2) => {
  date2.setUTCHours(0, 0, 0, 0);
}, (date2, step) => {
  date2.setUTCDate(date2.getUTCDate() + step);
}, (start2, end) => {
  return (end - start2) / durationDay;
}, (date2) => {
  return date2.getUTCDate() - 1;
});
var utcDays = utcDay.range;
var unixDay = timeInterval((date2) => {
  date2.setUTCHours(0, 0, 0, 0);
}, (date2, step) => {
  date2.setUTCDate(date2.getUTCDate() + step);
}, (start2, end) => {
  return (end - start2) / durationDay;
}, (date2) => {
  return Math.floor(date2 / durationDay);
});
var unixDays = unixDay.range;

// node_modules/d3-scale/node_modules/d3-time/src/week.js
function timeWeekday(i7) {
  return timeInterval((date2) => {
    date2.setDate(date2.getDate() - (date2.getDay() + 7 - i7) % 7);
    date2.setHours(0, 0, 0, 0);
  }, (date2, step) => {
    date2.setDate(date2.getDate() + step * 7);
  }, (start2, end) => {
    return (end - start2 - (end.getTimezoneOffset() - start2.getTimezoneOffset()) * durationMinute) / durationWeek;
  });
}
var timeSunday = timeWeekday(0);
var timeMonday = timeWeekday(1);
var timeTuesday = timeWeekday(2);
var timeWednesday = timeWeekday(3);
var timeThursday = timeWeekday(4);
var timeFriday = timeWeekday(5);
var timeSaturday = timeWeekday(6);
var timeSundays = timeSunday.range;
var timeMondays = timeMonday.range;
var timeTuesdays = timeTuesday.range;
var timeWednesdays = timeWednesday.range;
var timeThursdays = timeThursday.range;
var timeFridays = timeFriday.range;
var timeSaturdays = timeSaturday.range;
function utcWeekday(i7) {
  return timeInterval((date2) => {
    date2.setUTCDate(date2.getUTCDate() - (date2.getUTCDay() + 7 - i7) % 7);
    date2.setUTCHours(0, 0, 0, 0);
  }, (date2, step) => {
    date2.setUTCDate(date2.getUTCDate() + step * 7);
  }, (start2, end) => {
    return (end - start2) / durationWeek;
  });
}
var utcSunday = utcWeekday(0);
var utcMonday = utcWeekday(1);
var utcTuesday = utcWeekday(2);
var utcWednesday = utcWeekday(3);
var utcThursday = utcWeekday(4);
var utcFriday = utcWeekday(5);
var utcSaturday = utcWeekday(6);
var utcSundays = utcSunday.range;
var utcMondays = utcMonday.range;
var utcTuesdays = utcTuesday.range;
var utcWednesdays = utcWednesday.range;
var utcThursdays = utcThursday.range;
var utcFridays = utcFriday.range;
var utcSaturdays = utcSaturday.range;

// node_modules/d3-scale/node_modules/d3-time/src/month.js
var timeMonth = timeInterval((date2) => {
  date2.setDate(1);
  date2.setHours(0, 0, 0, 0);
}, (date2, step) => {
  date2.setMonth(date2.getMonth() + step);
}, (start2, end) => {
  return end.getMonth() - start2.getMonth() + (end.getFullYear() - start2.getFullYear()) * 12;
}, (date2) => {
  return date2.getMonth();
});
var timeMonths = timeMonth.range;
var utcMonth = timeInterval((date2) => {
  date2.setUTCDate(1);
  date2.setUTCHours(0, 0, 0, 0);
}, (date2, step) => {
  date2.setUTCMonth(date2.getUTCMonth() + step);
}, (start2, end) => {
  return end.getUTCMonth() - start2.getUTCMonth() + (end.getUTCFullYear() - start2.getUTCFullYear()) * 12;
}, (date2) => {
  return date2.getUTCMonth();
});
var utcMonths = utcMonth.range;

// node_modules/d3-scale/node_modules/d3-time/src/year.js
var timeYear = timeInterval((date2) => {
  date2.setMonth(0, 1);
  date2.setHours(0, 0, 0, 0);
}, (date2, step) => {
  date2.setFullYear(date2.getFullYear() + step);
}, (start2, end) => {
  return end.getFullYear() - start2.getFullYear();
}, (date2) => {
  return date2.getFullYear();
});
timeYear.every = (k4) => {
  return !isFinite(k4 = Math.floor(k4)) || !(k4 > 0) ? null : timeInterval((date2) => {
    date2.setFullYear(Math.floor(date2.getFullYear() / k4) * k4);
    date2.setMonth(0, 1);
    date2.setHours(0, 0, 0, 0);
  }, (date2, step) => {
    date2.setFullYear(date2.getFullYear() + step * k4);
  });
};
var timeYears = timeYear.range;
var utcYear = timeInterval((date2) => {
  date2.setUTCMonth(0, 1);
  date2.setUTCHours(0, 0, 0, 0);
}, (date2, step) => {
  date2.setUTCFullYear(date2.getUTCFullYear() + step);
}, (start2, end) => {
  return end.getUTCFullYear() - start2.getUTCFullYear();
}, (date2) => {
  return date2.getUTCFullYear();
});
utcYear.every = (k4) => {
  return !isFinite(k4 = Math.floor(k4)) || !(k4 > 0) ? null : timeInterval((date2) => {
    date2.setUTCFullYear(Math.floor(date2.getUTCFullYear() / k4) * k4);
    date2.setUTCMonth(0, 1);
    date2.setUTCHours(0, 0, 0, 0);
  }, (date2, step) => {
    date2.setUTCFullYear(date2.getUTCFullYear() + step * k4);
  });
};
var utcYears = utcYear.range;

// node_modules/d3-scale/node_modules/d3-time/src/ticks.js
function ticker(year2, month2, week, day2, hour2, minute2) {
  const tickIntervals = [
    [second, 1, durationSecond],
    [second, 5, 5 * durationSecond],
    [second, 15, 15 * durationSecond],
    [second, 30, 30 * durationSecond],
    [minute2, 1, durationMinute],
    [minute2, 5, 5 * durationMinute],
    [minute2, 15, 15 * durationMinute],
    [minute2, 30, 30 * durationMinute],
    [hour2, 1, durationHour],
    [hour2, 3, 3 * durationHour],
    [hour2, 6, 6 * durationHour],
    [hour2, 12, 12 * durationHour],
    [day2, 1, durationDay],
    [day2, 2, 2 * durationDay],
    [week, 1, durationWeek],
    [month2, 1, durationMonth],
    [month2, 3, 3 * durationMonth],
    [year2, 1, durationYear]
  ];
  function ticks2(start2, stop2, count2) {
    const reverse2 = stop2 < start2;
    if (reverse2) [start2, stop2] = [stop2, start2];
    const interval = count2 && typeof count2.range === "function" ? count2 : tickInterval(start2, stop2, count2);
    const ticks3 = interval ? interval.range(start2, +stop2 + 1) : [];
    return reverse2 ? ticks3.reverse() : ticks3;
  }
  function tickInterval(start2, stop2, count2) {
    const target = Math.abs(stop2 - start2) / count2;
    const i7 = bisector(([, , step2]) => step2).right(tickIntervals, target);
    if (i7 === tickIntervals.length) return year2.every(tickStep(start2 / durationYear, stop2 / durationYear, count2));
    if (i7 === 0) return millisecond.every(Math.max(tickStep(start2, stop2, count2), 1));
    const [t9, step] = tickIntervals[target / tickIntervals[i7 - 1][2] < tickIntervals[i7][2] / target ? i7 - 1 : i7];
    return t9.every(step);
  }
  return [ticks2, tickInterval];
}
var [utcTicks, utcTickInterval] = ticker(utcYear, utcMonth, utcSunday, unixDay, utcHour, utcMinute);
var [timeTicks, timeTickInterval] = ticker(timeYear, timeMonth, timeSunday, timeDay, timeHour, timeMinute);

// node_modules/d3-time/src/interval.js
var t03 = /* @__PURE__ */ new Date();
var t13 = /* @__PURE__ */ new Date();
function newInterval(floori, offseti, count2, field) {
  function interval(date2) {
    return floori(date2 = arguments.length === 0 ? /* @__PURE__ */ new Date() : /* @__PURE__ */ new Date(+date2)), date2;
  }
  interval.floor = function(date2) {
    return floori(date2 = /* @__PURE__ */ new Date(+date2)), date2;
  };
  interval.ceil = function(date2) {
    return floori(date2 = new Date(date2 - 1)), offseti(date2, 1), floori(date2), date2;
  };
  interval.round = function(date2) {
    var d0 = interval(date2), d1 = interval.ceil(date2);
    return date2 - d0 < d1 - date2 ? d0 : d1;
  };
  interval.offset = function(date2, step) {
    return offseti(date2 = /* @__PURE__ */ new Date(+date2), step == null ? 1 : Math.floor(step)), date2;
  };
  interval.range = function(start2, stop2, step) {
    var range2 = [], previous;
    start2 = interval.ceil(start2);
    step = step == null ? 1 : Math.floor(step);
    if (!(start2 < stop2) || !(step > 0)) return range2;
    do
      range2.push(previous = /* @__PURE__ */ new Date(+start2)), offseti(start2, step), floori(start2);
    while (previous < start2 && start2 < stop2);
    return range2;
  };
  interval.filter = function(test) {
    return newInterval(function(date2) {
      if (date2 >= date2) while (floori(date2), !test(date2)) date2.setTime(date2 - 1);
    }, function(date2, step) {
      if (date2 >= date2) {
        if (step < 0) while (++step <= 0) {
          while (offseti(date2, -1), !test(date2)) {
          }
        }
        else while (--step >= 0) {
          while (offseti(date2, 1), !test(date2)) {
          }
        }
      }
    });
  };
  if (count2) {
    interval.count = function(start2, end) {
      t03.setTime(+start2), t13.setTime(+end);
      floori(t03), floori(t13);
      return Math.floor(count2(t03, t13));
    };
    interval.every = function(step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval : interval.filter(field ? function(d5) {
        return field(d5) % step === 0;
      } : function(d5) {
        return interval.count(0, d5) % step === 0;
      });
    };
  }
  return interval;
}

// node_modules/d3-time/src/millisecond.js
var millisecond2 = newInterval(function() {
}, function(date2, step) {
  date2.setTime(+date2 + step);
}, function(start2, end) {
  return end - start2;
});
millisecond2.every = function(k4) {
  k4 = Math.floor(k4);
  if (!isFinite(k4) || !(k4 > 0)) return null;
  if (!(k4 > 1)) return millisecond2;
  return newInterval(function(date2) {
    date2.setTime(Math.floor(date2 / k4) * k4);
  }, function(date2, step) {
    date2.setTime(+date2 + step * k4);
  }, function(start2, end) {
    return (end - start2) / k4;
  });
};
var millisecond_default = millisecond2;
var milliseconds2 = millisecond2.range;

// node_modules/d3-time/src/duration.js
var durationSecond2 = 1e3;
var durationMinute2 = 6e4;
var durationHour2 = 36e5;
var durationDay2 = 864e5;
var durationWeek2 = 6048e5;

// node_modules/d3-time/src/second.js
var second2 = newInterval(function(date2) {
  date2.setTime(date2 - date2.getMilliseconds());
}, function(date2, step) {
  date2.setTime(+date2 + step * durationSecond2);
}, function(start2, end) {
  return (end - start2) / durationSecond2;
}, function(date2) {
  return date2.getUTCSeconds();
});
var second_default = second2;
var seconds2 = second2.range;

// node_modules/d3-time/src/minute.js
var minute = newInterval(function(date2) {
  date2.setTime(date2 - date2.getMilliseconds() - date2.getSeconds() * durationSecond2);
}, function(date2, step) {
  date2.setTime(+date2 + step * durationMinute2);
}, function(start2, end) {
  return (end - start2) / durationMinute2;
}, function(date2) {
  return date2.getMinutes();
});
var minute_default = minute;
var minutes = minute.range;

// node_modules/d3-time/src/hour.js
var hour = newInterval(function(date2) {
  date2.setTime(date2 - date2.getMilliseconds() - date2.getSeconds() * durationSecond2 - date2.getMinutes() * durationMinute2);
}, function(date2, step) {
  date2.setTime(+date2 + step * durationHour2);
}, function(start2, end) {
  return (end - start2) / durationHour2;
}, function(date2) {
  return date2.getHours();
});
var hour_default = hour;
var hours = hour.range;

// node_modules/d3-time/src/day.js
var day = newInterval(function(date2) {
  date2.setHours(0, 0, 0, 0);
}, function(date2, step) {
  date2.setDate(date2.getDate() + step);
}, function(start2, end) {
  return (end - start2 - (end.getTimezoneOffset() - start2.getTimezoneOffset()) * durationMinute2) / durationDay2;
}, function(date2) {
  return date2.getDate() - 1;
});
var day_default = day;
var days = day.range;

// node_modules/d3-time/src/week.js
function weekday(i7) {
  return newInterval(function(date2) {
    date2.setDate(date2.getDate() - (date2.getDay() + 7 - i7) % 7);
    date2.setHours(0, 0, 0, 0);
  }, function(date2, step) {
    date2.setDate(date2.getDate() + step * 7);
  }, function(start2, end) {
    return (end - start2 - (end.getTimezoneOffset() - start2.getTimezoneOffset()) * durationMinute2) / durationWeek2;
  });
}
var sunday = weekday(0);
var monday = weekday(1);
var tuesday = weekday(2);
var wednesday = weekday(3);
var thursday = weekday(4);
var friday = weekday(5);
var saturday = weekday(6);
var sundays = sunday.range;
var mondays = monday.range;
var tuesdays = tuesday.range;
var wednesdays = wednesday.range;
var thursdays = thursday.range;
var fridays = friday.range;
var saturdays = saturday.range;

// node_modules/d3-time/src/month.js
var month = newInterval(function(date2) {
  date2.setDate(1);
  date2.setHours(0, 0, 0, 0);
}, function(date2, step) {
  date2.setMonth(date2.getMonth() + step);
}, function(start2, end) {
  return end.getMonth() - start2.getMonth() + (end.getFullYear() - start2.getFullYear()) * 12;
}, function(date2) {
  return date2.getMonth();
});
var month_default = month;
var months = month.range;

// node_modules/d3-time/src/year.js
var year = newInterval(function(date2) {
  date2.setMonth(0, 1);
  date2.setHours(0, 0, 0, 0);
}, function(date2, step) {
  date2.setFullYear(date2.getFullYear() + step);
}, function(start2, end) {
  return end.getFullYear() - start2.getFullYear();
}, function(date2) {
  return date2.getFullYear();
});
year.every = function(k4) {
  return !isFinite(k4 = Math.floor(k4)) || !(k4 > 0) ? null : newInterval(function(date2) {
    date2.setFullYear(Math.floor(date2.getFullYear() / k4) * k4);
    date2.setMonth(0, 1);
    date2.setHours(0, 0, 0, 0);
  }, function(date2, step) {
    date2.setFullYear(date2.getFullYear() + step * k4);
  });
};
var year_default = year;
var years = year.range;

// node_modules/d3-time/src/utcMinute.js
var utcMinute2 = newInterval(function(date2) {
  date2.setUTCSeconds(0, 0);
}, function(date2, step) {
  date2.setTime(+date2 + step * durationMinute2);
}, function(start2, end) {
  return (end - start2) / durationMinute2;
}, function(date2) {
  return date2.getUTCMinutes();
});
var utcMinute_default = utcMinute2;
var utcMinutes2 = utcMinute2.range;

// node_modules/d3-time/src/utcHour.js
var utcHour2 = newInterval(function(date2) {
  date2.setUTCMinutes(0, 0, 0);
}, function(date2, step) {
  date2.setTime(+date2 + step * durationHour2);
}, function(start2, end) {
  return (end - start2) / durationHour2;
}, function(date2) {
  return date2.getUTCHours();
});
var utcHour_default = utcHour2;
var utcHours2 = utcHour2.range;

// node_modules/d3-time/src/utcDay.js
var utcDay2 = newInterval(function(date2) {
  date2.setUTCHours(0, 0, 0, 0);
}, function(date2, step) {
  date2.setUTCDate(date2.getUTCDate() + step);
}, function(start2, end) {
  return (end - start2) / durationDay2;
}, function(date2) {
  return date2.getUTCDate() - 1;
});
var utcDay_default = utcDay2;
var utcDays2 = utcDay2.range;

// node_modules/d3-time/src/utcWeek.js
function utcWeekday2(i7) {
  return newInterval(function(date2) {
    date2.setUTCDate(date2.getUTCDate() - (date2.getUTCDay() + 7 - i7) % 7);
    date2.setUTCHours(0, 0, 0, 0);
  }, function(date2, step) {
    date2.setUTCDate(date2.getUTCDate() + step * 7);
  }, function(start2, end) {
    return (end - start2) / durationWeek2;
  });
}
var utcSunday2 = utcWeekday2(0);
var utcMonday2 = utcWeekday2(1);
var utcTuesday2 = utcWeekday2(2);
var utcWednesday2 = utcWeekday2(3);
var utcThursday2 = utcWeekday2(4);
var utcFriday2 = utcWeekday2(5);
var utcSaturday2 = utcWeekday2(6);
var utcSundays2 = utcSunday2.range;
var utcMondays2 = utcMonday2.range;
var utcTuesdays2 = utcTuesday2.range;
var utcWednesdays2 = utcWednesday2.range;
var utcThursdays2 = utcThursday2.range;
var utcFridays2 = utcFriday2.range;
var utcSaturdays2 = utcSaturday2.range;

// node_modules/d3-time/src/utcMonth.js
var utcMonth2 = newInterval(function(date2) {
  date2.setUTCDate(1);
  date2.setUTCHours(0, 0, 0, 0);
}, function(date2, step) {
  date2.setUTCMonth(date2.getUTCMonth() + step);
}, function(start2, end) {
  return end.getUTCMonth() - start2.getUTCMonth() + (end.getUTCFullYear() - start2.getUTCFullYear()) * 12;
}, function(date2) {
  return date2.getUTCMonth();
});
var utcMonth_default = utcMonth2;
var utcMonths2 = utcMonth2.range;

// node_modules/d3-time/src/utcYear.js
var utcYear2 = newInterval(function(date2) {
  date2.setUTCMonth(0, 1);
  date2.setUTCHours(0, 0, 0, 0);
}, function(date2, step) {
  date2.setUTCFullYear(date2.getUTCFullYear() + step);
}, function(start2, end) {
  return end.getUTCFullYear() - start2.getUTCFullYear();
}, function(date2) {
  return date2.getUTCFullYear();
});
utcYear2.every = function(k4) {
  return !isFinite(k4 = Math.floor(k4)) || !(k4 > 0) ? null : newInterval(function(date2) {
    date2.setUTCFullYear(Math.floor(date2.getUTCFullYear() / k4) * k4);
    date2.setUTCMonth(0, 1);
    date2.setUTCHours(0, 0, 0, 0);
  }, function(date2, step) {
    date2.setUTCFullYear(date2.getUTCFullYear() + step * k4);
  });
};
var utcYear_default = utcYear2;
var utcYears2 = utcYear2.range;

// node_modules/d3-time-format/src/locale.js
function localDate(d5) {
  if (0 <= d5.y && d5.y < 100) {
    var date2 = new Date(-1, d5.m, d5.d, d5.H, d5.M, d5.S, d5.L);
    date2.setFullYear(d5.y);
    return date2;
  }
  return new Date(d5.y, d5.m, d5.d, d5.H, d5.M, d5.S, d5.L);
}
function utcDate(d5) {
  if (0 <= d5.y && d5.y < 100) {
    var date2 = new Date(Date.UTC(-1, d5.m, d5.d, d5.H, d5.M, d5.S, d5.L));
    date2.setUTCFullYear(d5.y);
    return date2;
  }
  return new Date(Date.UTC(d5.y, d5.m, d5.d, d5.H, d5.M, d5.S, d5.L));
}
function newDate(y5, m3, d5) {
  return { y: y5, m: m3, d: d5, H: 0, M: 0, S: 0, L: 0 };
}
function formatLocale(locale3) {
  var locale_dateTime = locale3.dateTime, locale_date = locale3.date, locale_time = locale3.time, locale_periods = locale3.periods, locale_weekdays = locale3.days, locale_shortWeekdays = locale3.shortDays, locale_months = locale3.months, locale_shortMonths = locale3.shortMonths;
  var periodRe = formatRe(locale_periods), periodLookup = formatLookup(locale_periods), weekdayRe = formatRe(locale_weekdays), weekdayLookup = formatLookup(locale_weekdays), shortWeekdayRe = formatRe(locale_shortWeekdays), shortWeekdayLookup = formatLookup(locale_shortWeekdays), monthRe = formatRe(locale_months), monthLookup = formatLookup(locale_months), shortMonthRe = formatRe(locale_shortMonths), shortMonthLookup = formatLookup(locale_shortMonths);
  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "f": formatMicroseconds,
    "g": formatYearISO,
    "G": formatFullYearISO,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "q": formatQuarter,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatSeconds,
    "u": formatWeekdayNumberMonday,
    "U": formatWeekNumberSunday,
    "V": formatWeekNumberISO,
    "w": formatWeekdayNumberSunday,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };
  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "f": formatUTCMicroseconds,
    "g": formatUTCYearISO,
    "G": formatUTCFullYearISO,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "q": formatUTCQuarter,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatUTCSeconds,
    "u": formatUTCWeekdayNumberMonday,
    "U": formatUTCWeekNumberSunday,
    "V": formatUTCWeekNumberISO,
    "w": formatUTCWeekdayNumberSunday,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };
  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "f": parseMicroseconds,
    "g": parseYear,
    "G": parseFullYear,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "q": parseQuarter,
    "Q": parseUnixTimestamp,
    "s": parseUnixTimestampSeconds,
    "S": parseSeconds,
    "u": parseWeekdayNumberMonday,
    "U": parseWeekNumberSunday,
    "V": parseWeekNumberISO,
    "w": parseWeekdayNumberSunday,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);
  function newFormat(specifier, formats2) {
    return function(date2) {
      var string = [], i7 = -1, j5 = 0, n8 = specifier.length, c10, pad2, format2;
      if (!(date2 instanceof Date)) date2 = /* @__PURE__ */ new Date(+date2);
      while (++i7 < n8) {
        if (specifier.charCodeAt(i7) === 37) {
          string.push(specifier.slice(j5, i7));
          if ((pad2 = pads[c10 = specifier.charAt(++i7)]) != null) c10 = specifier.charAt(++i7);
          else pad2 = c10 === "e" ? " " : "0";
          if (format2 = formats2[c10]) c10 = format2(date2, pad2);
          string.push(c10);
          j5 = i7 + 1;
        }
      }
      string.push(specifier.slice(j5, i7));
      return string.join("");
    };
  }
  function newParse(specifier, Z2) {
    return function(string) {
      var d5 = newDate(1900, void 0, 1), i7 = parseSpecifier(d5, specifier, string += "", 0), week, day2;
      if (i7 != string.length) return null;
      if ("Q" in d5) return new Date(d5.Q);
      if ("s" in d5) return new Date(d5.s * 1e3 + ("L" in d5 ? d5.L : 0));
      if (Z2 && !("Z" in d5)) d5.Z = 0;
      if ("p" in d5) d5.H = d5.H % 12 + d5.p * 12;
      if (d5.m === void 0) d5.m = "q" in d5 ? d5.q : 0;
      if ("V" in d5) {
        if (d5.V < 1 || d5.V > 53) return null;
        if (!("w" in d5)) d5.w = 1;
        if ("Z" in d5) {
          week = utcDate(newDate(d5.y, 0, 1)), day2 = week.getUTCDay();
          week = day2 > 4 || day2 === 0 ? utcMonday2.ceil(week) : utcMonday2(week);
          week = utcDay_default.offset(week, (d5.V - 1) * 7);
          d5.y = week.getUTCFullYear();
          d5.m = week.getUTCMonth();
          d5.d = week.getUTCDate() + (d5.w + 6) % 7;
        } else {
          week = localDate(newDate(d5.y, 0, 1)), day2 = week.getDay();
          week = day2 > 4 || day2 === 0 ? monday.ceil(week) : monday(week);
          week = day_default.offset(week, (d5.V - 1) * 7);
          d5.y = week.getFullYear();
          d5.m = week.getMonth();
          d5.d = week.getDate() + (d5.w + 6) % 7;
        }
      } else if ("W" in d5 || "U" in d5) {
        if (!("w" in d5)) d5.w = "u" in d5 ? d5.u % 7 : "W" in d5 ? 1 : 0;
        day2 = "Z" in d5 ? utcDate(newDate(d5.y, 0, 1)).getUTCDay() : localDate(newDate(d5.y, 0, 1)).getDay();
        d5.m = 0;
        d5.d = "W" in d5 ? (d5.w + 6) % 7 + d5.W * 7 - (day2 + 5) % 7 : d5.w + d5.U * 7 - (day2 + 6) % 7;
      }
      if ("Z" in d5) {
        d5.H += d5.Z / 100 | 0;
        d5.M += d5.Z % 100;
        return utcDate(d5);
      }
      return localDate(d5);
    };
  }
  function parseSpecifier(d5, specifier, string, j5) {
    var i7 = 0, n8 = specifier.length, m3 = string.length, c10, parse;
    while (i7 < n8) {
      if (j5 >= m3) return -1;
      c10 = specifier.charCodeAt(i7++);
      if (c10 === 37) {
        c10 = specifier.charAt(i7++);
        parse = parses[c10 in pads ? specifier.charAt(i7++) : c10];
        if (!parse || (j5 = parse(d5, string, j5)) < 0) return -1;
      } else if (c10 != string.charCodeAt(j5++)) {
        return -1;
      }
    }
    return j5;
  }
  function parsePeriod(d5, string, i7) {
    var n8 = periodRe.exec(string.slice(i7));
    return n8 ? (d5.p = periodLookup.get(n8[0].toLowerCase()), i7 + n8[0].length) : -1;
  }
  function parseShortWeekday(d5, string, i7) {
    var n8 = shortWeekdayRe.exec(string.slice(i7));
    return n8 ? (d5.w = shortWeekdayLookup.get(n8[0].toLowerCase()), i7 + n8[0].length) : -1;
  }
  function parseWeekday(d5, string, i7) {
    var n8 = weekdayRe.exec(string.slice(i7));
    return n8 ? (d5.w = weekdayLookup.get(n8[0].toLowerCase()), i7 + n8[0].length) : -1;
  }
  function parseShortMonth(d5, string, i7) {
    var n8 = shortMonthRe.exec(string.slice(i7));
    return n8 ? (d5.m = shortMonthLookup.get(n8[0].toLowerCase()), i7 + n8[0].length) : -1;
  }
  function parseMonth(d5, string, i7) {
    var n8 = monthRe.exec(string.slice(i7));
    return n8 ? (d5.m = monthLookup.get(n8[0].toLowerCase()), i7 + n8[0].length) : -1;
  }
  function parseLocaleDateTime(d5, string, i7) {
    return parseSpecifier(d5, locale_dateTime, string, i7);
  }
  function parseLocaleDate(d5, string, i7) {
    return parseSpecifier(d5, locale_date, string, i7);
  }
  function parseLocaleTime(d5, string, i7) {
    return parseSpecifier(d5, locale_time, string, i7);
  }
  function formatShortWeekday(d5) {
    return locale_shortWeekdays[d5.getDay()];
  }
  function formatWeekday(d5) {
    return locale_weekdays[d5.getDay()];
  }
  function formatShortMonth(d5) {
    return locale_shortMonths[d5.getMonth()];
  }
  function formatMonth(d5) {
    return locale_months[d5.getMonth()];
  }
  function formatPeriod(d5) {
    return locale_periods[+(d5.getHours() >= 12)];
  }
  function formatQuarter(d5) {
    return 1 + ~~(d5.getMonth() / 3);
  }
  function formatUTCShortWeekday(d5) {
    return locale_shortWeekdays[d5.getUTCDay()];
  }
  function formatUTCWeekday(d5) {
    return locale_weekdays[d5.getUTCDay()];
  }
  function formatUTCShortMonth(d5) {
    return locale_shortMonths[d5.getUTCMonth()];
  }
  function formatUTCMonth(d5) {
    return locale_months[d5.getUTCMonth()];
  }
  function formatUTCPeriod(d5) {
    return locale_periods[+(d5.getUTCHours() >= 12)];
  }
  function formatUTCQuarter(d5) {
    return 1 + ~~(d5.getUTCMonth() / 3);
  }
  return {
    format: function(specifier) {
      var f2 = newFormat(specifier += "", formats);
      f2.toString = function() {
        return specifier;
      };
      return f2;
    },
    parse: function(specifier) {
      var p4 = newParse(specifier += "", false);
      p4.toString = function() {
        return specifier;
      };
      return p4;
    },
    utcFormat: function(specifier) {
      var f2 = newFormat(specifier += "", utcFormats);
      f2.toString = function() {
        return specifier;
      };
      return f2;
    },
    utcParse: function(specifier) {
      var p4 = newParse(specifier += "", true);
      p4.toString = function() {
        return specifier;
      };
      return p4;
    }
  };
}
var pads = { "-": "", "_": " ", "0": "0" };
var numberRe = /^\s*\d+/;
var percentRe = /^%/;
var requoteRe = /[\\^$*+?|[\]().{}]/g;
function pad(value, fill, width) {
  var sign2 = value < 0 ? "-" : "", string = (sign2 ? -value : value) + "", length = string.length;
  return sign2 + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}
function requote(s6) {
  return s6.replace(requoteRe, "\\$&");
}
function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}
function formatLookup(names) {
  return new Map(names.map((name, i7) => [name.toLowerCase(), i7]));
}
function parseWeekdayNumberSunday(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 1));
  return n8 ? (d5.w = +n8[0], i7 + n8[0].length) : -1;
}
function parseWeekdayNumberMonday(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 1));
  return n8 ? (d5.u = +n8[0], i7 + n8[0].length) : -1;
}
function parseWeekNumberSunday(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 2));
  return n8 ? (d5.U = +n8[0], i7 + n8[0].length) : -1;
}
function parseWeekNumberISO(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 2));
  return n8 ? (d5.V = +n8[0], i7 + n8[0].length) : -1;
}
function parseWeekNumberMonday(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 2));
  return n8 ? (d5.W = +n8[0], i7 + n8[0].length) : -1;
}
function parseFullYear(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 4));
  return n8 ? (d5.y = +n8[0], i7 + n8[0].length) : -1;
}
function parseYear(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 2));
  return n8 ? (d5.y = +n8[0] + (+n8[0] > 68 ? 1900 : 2e3), i7 + n8[0].length) : -1;
}
function parseZone(d5, string, i7) {
  var n8 = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i7, i7 + 6));
  return n8 ? (d5.Z = n8[1] ? 0 : -(n8[2] + (n8[3] || "00")), i7 + n8[0].length) : -1;
}
function parseQuarter(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 1));
  return n8 ? (d5.q = n8[0] * 3 - 3, i7 + n8[0].length) : -1;
}
function parseMonthNumber(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 2));
  return n8 ? (d5.m = n8[0] - 1, i7 + n8[0].length) : -1;
}
function parseDayOfMonth(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 2));
  return n8 ? (d5.d = +n8[0], i7 + n8[0].length) : -1;
}
function parseDayOfYear(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 3));
  return n8 ? (d5.m = 0, d5.d = +n8[0], i7 + n8[0].length) : -1;
}
function parseHour24(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 2));
  return n8 ? (d5.H = +n8[0], i7 + n8[0].length) : -1;
}
function parseMinutes(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 2));
  return n8 ? (d5.M = +n8[0], i7 + n8[0].length) : -1;
}
function parseSeconds(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 2));
  return n8 ? (d5.S = +n8[0], i7 + n8[0].length) : -1;
}
function parseMilliseconds(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 3));
  return n8 ? (d5.L = +n8[0], i7 + n8[0].length) : -1;
}
function parseMicroseconds(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7, i7 + 6));
  return n8 ? (d5.L = Math.floor(n8[0] / 1e3), i7 + n8[0].length) : -1;
}
function parseLiteralPercent(d5, string, i7) {
  var n8 = percentRe.exec(string.slice(i7, i7 + 1));
  return n8 ? i7 + n8[0].length : -1;
}
function parseUnixTimestamp(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7));
  return n8 ? (d5.Q = +n8[0], i7 + n8[0].length) : -1;
}
function parseUnixTimestampSeconds(d5, string, i7) {
  var n8 = numberRe.exec(string.slice(i7));
  return n8 ? (d5.s = +n8[0], i7 + n8[0].length) : -1;
}
function formatDayOfMonth(d5, p4) {
  return pad(d5.getDate(), p4, 2);
}
function formatHour24(d5, p4) {
  return pad(d5.getHours(), p4, 2);
}
function formatHour12(d5, p4) {
  return pad(d5.getHours() % 12 || 12, p4, 2);
}
function formatDayOfYear(d5, p4) {
  return pad(1 + day_default.count(year_default(d5), d5), p4, 3);
}
function formatMilliseconds(d5, p4) {
  return pad(d5.getMilliseconds(), p4, 3);
}
function formatMicroseconds(d5, p4) {
  return formatMilliseconds(d5, p4) + "000";
}
function formatMonthNumber(d5, p4) {
  return pad(d5.getMonth() + 1, p4, 2);
}
function formatMinutes(d5, p4) {
  return pad(d5.getMinutes(), p4, 2);
}
function formatSeconds(d5, p4) {
  return pad(d5.getSeconds(), p4, 2);
}
function formatWeekdayNumberMonday(d5) {
  var day2 = d5.getDay();
  return day2 === 0 ? 7 : day2;
}
function formatWeekNumberSunday(d5, p4) {
  return pad(sunday.count(year_default(d5) - 1, d5), p4, 2);
}
function dISO(d5) {
  var day2 = d5.getDay();
  return day2 >= 4 || day2 === 0 ? thursday(d5) : thursday.ceil(d5);
}
function formatWeekNumberISO(d5, p4) {
  d5 = dISO(d5);
  return pad(thursday.count(year_default(d5), d5) + (year_default(d5).getDay() === 4), p4, 2);
}
function formatWeekdayNumberSunday(d5) {
  return d5.getDay();
}
function formatWeekNumberMonday(d5, p4) {
  return pad(monday.count(year_default(d5) - 1, d5), p4, 2);
}
function formatYear(d5, p4) {
  return pad(d5.getFullYear() % 100, p4, 2);
}
function formatYearISO(d5, p4) {
  d5 = dISO(d5);
  return pad(d5.getFullYear() % 100, p4, 2);
}
function formatFullYear(d5, p4) {
  return pad(d5.getFullYear() % 1e4, p4, 4);
}
function formatFullYearISO(d5, p4) {
  var day2 = d5.getDay();
  d5 = day2 >= 4 || day2 === 0 ? thursday(d5) : thursday.ceil(d5);
  return pad(d5.getFullYear() % 1e4, p4, 4);
}
function formatZone(d5) {
  var z6 = d5.getTimezoneOffset();
  return (z6 > 0 ? "-" : (z6 *= -1, "+")) + pad(z6 / 60 | 0, "0", 2) + pad(z6 % 60, "0", 2);
}
function formatUTCDayOfMonth(d5, p4) {
  return pad(d5.getUTCDate(), p4, 2);
}
function formatUTCHour24(d5, p4) {
  return pad(d5.getUTCHours(), p4, 2);
}
function formatUTCHour12(d5, p4) {
  return pad(d5.getUTCHours() % 12 || 12, p4, 2);
}
function formatUTCDayOfYear(d5, p4) {
  return pad(1 + utcDay_default.count(utcYear_default(d5), d5), p4, 3);
}
function formatUTCMilliseconds(d5, p4) {
  return pad(d5.getUTCMilliseconds(), p4, 3);
}
function formatUTCMicroseconds(d5, p4) {
  return formatUTCMilliseconds(d5, p4) + "000";
}
function formatUTCMonthNumber(d5, p4) {
  return pad(d5.getUTCMonth() + 1, p4, 2);
}
function formatUTCMinutes(d5, p4) {
  return pad(d5.getUTCMinutes(), p4, 2);
}
function formatUTCSeconds(d5, p4) {
  return pad(d5.getUTCSeconds(), p4, 2);
}
function formatUTCWeekdayNumberMonday(d5) {
  var dow = d5.getUTCDay();
  return dow === 0 ? 7 : dow;
}
function formatUTCWeekNumberSunday(d5, p4) {
  return pad(utcSunday2.count(utcYear_default(d5) - 1, d5), p4, 2);
}
function UTCdISO(d5) {
  var day2 = d5.getUTCDay();
  return day2 >= 4 || day2 === 0 ? utcThursday2(d5) : utcThursday2.ceil(d5);
}
function formatUTCWeekNumberISO(d5, p4) {
  d5 = UTCdISO(d5);
  return pad(utcThursday2.count(utcYear_default(d5), d5) + (utcYear_default(d5).getUTCDay() === 4), p4, 2);
}
function formatUTCWeekdayNumberSunday(d5) {
  return d5.getUTCDay();
}
function formatUTCWeekNumberMonday(d5, p4) {
  return pad(utcMonday2.count(utcYear_default(d5) - 1, d5), p4, 2);
}
function formatUTCYear(d5, p4) {
  return pad(d5.getUTCFullYear() % 100, p4, 2);
}
function formatUTCYearISO(d5, p4) {
  d5 = UTCdISO(d5);
  return pad(d5.getUTCFullYear() % 100, p4, 2);
}
function formatUTCFullYear(d5, p4) {
  return pad(d5.getUTCFullYear() % 1e4, p4, 4);
}
function formatUTCFullYearISO(d5, p4) {
  var day2 = d5.getUTCDay();
  d5 = day2 >= 4 || day2 === 0 ? utcThursday2(d5) : utcThursday2.ceil(d5);
  return pad(d5.getUTCFullYear() % 1e4, p4, 4);
}
function formatUTCZone() {
  return "+0000";
}
function formatLiteralPercent() {
  return "%";
}
function formatUnixTimestamp(d5) {
  return +d5;
}
function formatUnixTimestampSeconds(d5) {
  return Math.floor(+d5 / 1e3);
}

// node_modules/d3-time-format/src/defaultLocale.js
var locale2;
var timeFormat;
var timeParse;
var utcFormat;
var utcParse;
defaultLocale2({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});
function defaultLocale2(definition) {
  locale2 = formatLocale(definition);
  timeFormat = locale2.format;
  timeParse = locale2.parse;
  utcFormat = locale2.utcFormat;
  utcParse = locale2.utcParse;
  return locale2;
}

// node_modules/d3-time-format/src/isoFormat.js
var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";
function formatIsoNative(date2) {
  return date2.toISOString();
}
var formatIso = Date.prototype.toISOString ? formatIsoNative : utcFormat(isoSpecifier);

// node_modules/d3-time-format/src/isoParse.js
function parseIsoNative(string) {
  var date2 = new Date(string);
  return isNaN(date2) ? null : date2;
}
var parseIso = +/* @__PURE__ */ new Date("2000-01-01T00:00:00.000Z") ? parseIsoNative : utcParse(isoSpecifier);

// node_modules/d3-scale/src/time.js
function date(t9) {
  return new Date(t9);
}
function number3(t9) {
  return t9 instanceof Date ? +t9 : +/* @__PURE__ */ new Date(+t9);
}
function calendar(ticks2, tickInterval, year2, month2, week, day2, hour2, minute2, second3, format2) {
  var scale = continuous(), invert = scale.invert, domain = scale.domain;
  var formatMillisecond = format2(".%L"), formatSecond = format2(":%S"), formatMinute = format2("%I:%M"), formatHour = format2("%I %p"), formatDay = format2("%a %d"), formatWeek = format2("%b %d"), formatMonth = format2("%B"), formatYear2 = format2("%Y");
  function tickFormat2(date2) {
    return (second3(date2) < date2 ? formatMillisecond : minute2(date2) < date2 ? formatSecond : hour2(date2) < date2 ? formatMinute : day2(date2) < date2 ? formatHour : month2(date2) < date2 ? week(date2) < date2 ? formatDay : formatWeek : year2(date2) < date2 ? formatMonth : formatYear2)(date2);
  }
  scale.invert = function(y5) {
    return new Date(invert(y5));
  };
  scale.domain = function(_3) {
    return arguments.length ? domain(Array.from(_3, number3)) : domain().map(date);
  };
  scale.ticks = function(interval) {
    var d5 = domain();
    return ticks2(d5[0], d5[d5.length - 1], interval == null ? 10 : interval);
  };
  scale.tickFormat = function(count2, specifier) {
    return specifier == null ? tickFormat2 : format2(specifier);
  };
  scale.nice = function(interval) {
    var d5 = domain();
    if (!interval || typeof interval.range !== "function") interval = tickInterval(d5[0], d5[d5.length - 1], interval == null ? 10 : interval);
    return interval ? domain(nice2(d5, interval)) : scale;
  };
  scale.copy = function() {
    return copy(scale, calendar(ticks2, tickInterval, year2, month2, week, day2, hour2, minute2, second3, format2));
  };
  return scale;
}
function time() {
  return initRange.apply(calendar(timeTicks, timeTickInterval, timeYear, timeMonth, timeSunday, timeDay, timeHour, timeMinute, second, timeFormat).domain([new Date(2e3, 0, 1), new Date(2e3, 0, 2)]), arguments);
}

// node_modules/d3-scale/src/utcTime.js
function utcTime() {
  return initRange.apply(calendar(utcTicks, utcTickInterval, utcYear, utcMonth, utcSunday, utcDay, utcHour, utcMinute, second, utcFormat).domain([Date.UTC(2e3, 0, 1), Date.UTC(2e3, 0, 2)]), arguments);
}

// node_modules/d3-scale-chromatic/src/colors.js
function colors_default(specifier) {
  var n8 = specifier.length / 6 | 0, colors3 = new Array(n8), i7 = 0;
  while (i7 < n8) colors3[i7] = "#" + specifier.slice(i7 * 6, ++i7 * 6);
  return colors3;
}

// node_modules/d3-scale-chromatic/src/categorical/category10.js
var category10_default = colors_default("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

// node_modules/d3-scale-chromatic/src/categorical/Accent.js
var Accent_default = colors_default("7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666");

// node_modules/d3-scale-chromatic/src/categorical/Dark2.js
var Dark2_default = colors_default("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666");

// node_modules/d3-scale-chromatic/src/categorical/observable10.js
var observable10_default = colors_default("4269d0efb118ff725c6cc5b03ca951ff8ab7a463f297bbf59c6b4e9498a0");

// node_modules/d3-scale-chromatic/src/categorical/Paired.js
var Paired_default = colors_default("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");

// node_modules/d3-scale-chromatic/src/categorical/Pastel1.js
var Pastel1_default = colors_default("fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2");

// node_modules/d3-scale-chromatic/src/categorical/Pastel2.js
var Pastel2_default = colors_default("b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc");

// node_modules/d3-scale-chromatic/src/categorical/Set1.js
var Set1_default = colors_default("e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999");

// node_modules/d3-scale-chromatic/src/categorical/Set2.js
var Set2_default = colors_default("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");

// node_modules/d3-scale-chromatic/src/categorical/Set3.js
var Set3_default = colors_default("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f");

// node_modules/d3-scale-chromatic/src/categorical/Tableau10.js
var Tableau10_default = colors_default("4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab");

// node_modules/d3-scale-chromatic/src/ramp.js
var ramp_default = (scheme28) => rgbBasis(scheme28[scheme28.length - 1]);

// node_modules/d3-scale-chromatic/src/diverging/BrBG.js
var scheme = new Array(3).concat(
  "d8b365f5f5f55ab4ac",
  "a6611adfc27d80cdc1018571",
  "a6611adfc27df5f5f580cdc1018571",
  "8c510ad8b365f6e8c3c7eae55ab4ac01665e",
  "8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e",
  "8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e",
  "8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e",
  "5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30",
  "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30"
).map(colors_default);
var BrBG_default = ramp_default(scheme);

// node_modules/d3-scale-chromatic/src/diverging/PRGn.js
var scheme2 = new Array(3).concat(
  "af8dc3f7f7f77fbf7b",
  "7b3294c2a5cfa6dba0008837",
  "7b3294c2a5cff7f7f7a6dba0008837",
  "762a83af8dc3e7d4e8d9f0d37fbf7b1b7837",
  "762a83af8dc3e7d4e8f7f7f7d9f0d37fbf7b1b7837",
  "762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b7837",
  "762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b7837",
  "40004b762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b783700441b",
  "40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b"
).map(colors_default);
var PRGn_default = ramp_default(scheme2);

// node_modules/d3-scale-chromatic/src/diverging/PiYG.js
var scheme3 = new Array(3).concat(
  "e9a3c9f7f7f7a1d76a",
  "d01c8bf1b6dab8e1864dac26",
  "d01c8bf1b6daf7f7f7b8e1864dac26",
  "c51b7de9a3c9fde0efe6f5d0a1d76a4d9221",
  "c51b7de9a3c9fde0eff7f7f7e6f5d0a1d76a4d9221",
  "c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221",
  "c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221",
  "8e0152c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221276419",
  "8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419"
).map(colors_default);
var PiYG_default = ramp_default(scheme3);

// node_modules/d3-scale-chromatic/src/diverging/PuOr.js
var scheme4 = new Array(3).concat(
  "998ec3f7f7f7f1a340",
  "5e3c99b2abd2fdb863e66101",
  "5e3c99b2abd2f7f7f7fdb863e66101",
  "542788998ec3d8daebfee0b6f1a340b35806",
  "542788998ec3d8daebf7f7f7fee0b6f1a340b35806",
  "5427888073acb2abd2d8daebfee0b6fdb863e08214b35806",
  "5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b35806",
  "2d004b5427888073acb2abd2d8daebfee0b6fdb863e08214b358067f3b08",
  "2d004b5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b358067f3b08"
).map(colors_default);
var PuOr_default = ramp_default(scheme4);

// node_modules/d3-scale-chromatic/src/diverging/RdBu.js
var scheme5 = new Array(3).concat(
  "ef8a62f7f7f767a9cf",
  "ca0020f4a58292c5de0571b0",
  "ca0020f4a582f7f7f792c5de0571b0",
  "b2182bef8a62fddbc7d1e5f067a9cf2166ac",
  "b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac",
  "b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac",
  "b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac",
  "67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061",
  "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061"
).map(colors_default);
var RdBu_default = ramp_default(scheme5);

// node_modules/d3-scale-chromatic/src/diverging/RdGy.js
var scheme6 = new Array(3).concat(
  "ef8a62ffffff999999",
  "ca0020f4a582bababa404040",
  "ca0020f4a582ffffffbababa404040",
  "b2182bef8a62fddbc7e0e0e09999994d4d4d",
  "b2182bef8a62fddbc7ffffffe0e0e09999994d4d4d",
  "b2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d",
  "b2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d",
  "67001fb2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d1a1a1a",
  "67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a"
).map(colors_default);
var RdGy_default = ramp_default(scheme6);

// node_modules/d3-scale-chromatic/src/diverging/RdYlBu.js
var scheme7 = new Array(3).concat(
  "fc8d59ffffbf91bfdb",
  "d7191cfdae61abd9e92c7bb6",
  "d7191cfdae61ffffbfabd9e92c7bb6",
  "d73027fc8d59fee090e0f3f891bfdb4575b4",
  "d73027fc8d59fee090ffffbfe0f3f891bfdb4575b4",
  "d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4",
  "d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4",
  "a50026d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4313695",
  "a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695"
).map(colors_default);
var RdYlBu_default = ramp_default(scheme7);

// node_modules/d3-scale-chromatic/src/diverging/RdYlGn.js
var scheme8 = new Array(3).concat(
  "fc8d59ffffbf91cf60",
  "d7191cfdae61a6d96a1a9641",
  "d7191cfdae61ffffbfa6d96a1a9641",
  "d73027fc8d59fee08bd9ef8b91cf601a9850",
  "d73027fc8d59fee08bffffbfd9ef8b91cf601a9850",
  "d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850",
  "d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850",
  "a50026d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850006837",
  "a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837"
).map(colors_default);
var RdYlGn_default = ramp_default(scheme8);

// node_modules/d3-scale-chromatic/src/diverging/Spectral.js
var scheme9 = new Array(3).concat(
  "fc8d59ffffbf99d594",
  "d7191cfdae61abdda42b83ba",
  "d7191cfdae61ffffbfabdda42b83ba",
  "d53e4ffc8d59fee08be6f59899d5943288bd",
  "d53e4ffc8d59fee08bffffbfe6f59899d5943288bd",
  "d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd",
  "d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd",
  "9e0142d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd5e4fa2",
  "9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2"
).map(colors_default);
var Spectral_default = ramp_default(scheme9);

// node_modules/d3-scale-chromatic/src/sequential-multi/BuGn.js
var scheme10 = new Array(3).concat(
  "e5f5f999d8c92ca25f",
  "edf8fbb2e2e266c2a4238b45",
  "edf8fbb2e2e266c2a42ca25f006d2c",
  "edf8fbccece699d8c966c2a42ca25f006d2c",
  "edf8fbccece699d8c966c2a441ae76238b45005824",
  "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45005824",
  "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b"
).map(colors_default);
var BuGn_default = ramp_default(scheme10);

// node_modules/d3-scale-chromatic/src/sequential-multi/BuPu.js
var scheme11 = new Array(3).concat(
  "e0ecf49ebcda8856a7",
  "edf8fbb3cde38c96c688419d",
  "edf8fbb3cde38c96c68856a7810f7c",
  "edf8fbbfd3e69ebcda8c96c68856a7810f7c",
  "edf8fbbfd3e69ebcda8c96c68c6bb188419d6e016b",
  "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d6e016b",
  "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b"
).map(colors_default);
var BuPu_default = ramp_default(scheme11);

// node_modules/d3-scale-chromatic/src/sequential-multi/GnBu.js
var scheme12 = new Array(3).concat(
  "e0f3dba8ddb543a2ca",
  "f0f9e8bae4bc7bccc42b8cbe",
  "f0f9e8bae4bc7bccc443a2ca0868ac",
  "f0f9e8ccebc5a8ddb57bccc443a2ca0868ac",
  "f0f9e8ccebc5a8ddb57bccc44eb3d32b8cbe08589e",
  "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe08589e",
  "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081"
).map(colors_default);
var GnBu_default = ramp_default(scheme12);

// node_modules/d3-scale-chromatic/src/sequential-multi/OrRd.js
var scheme13 = new Array(3).concat(
  "fee8c8fdbb84e34a33",
  "fef0d9fdcc8afc8d59d7301f",
  "fef0d9fdcc8afc8d59e34a33b30000",
  "fef0d9fdd49efdbb84fc8d59e34a33b30000",
  "fef0d9fdd49efdbb84fc8d59ef6548d7301f990000",
  "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301f990000",
  "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000"
).map(colors_default);
var OrRd_default = ramp_default(scheme13);

// node_modules/d3-scale-chromatic/src/sequential-multi/PuBuGn.js
var scheme14 = new Array(3).concat(
  "ece2f0a6bddb1c9099",
  "f6eff7bdc9e167a9cf02818a",
  "f6eff7bdc9e167a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636"
).map(colors_default);
var PuBuGn_default = ramp_default(scheme14);

// node_modules/d3-scale-chromatic/src/sequential-multi/PuBu.js
var scheme15 = new Array(3).concat(
  "ece7f2a6bddb2b8cbe",
  "f1eef6bdc9e174a9cf0570b0",
  "f1eef6bdc9e174a9cf2b8cbe045a8d",
  "f1eef6d0d1e6a6bddb74a9cf2b8cbe045a8d",
  "f1eef6d0d1e6a6bddb74a9cf3690c00570b0034e7b",
  "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0034e7b",
  "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858"
).map(colors_default);
var PuBu_default = ramp_default(scheme15);

// node_modules/d3-scale-chromatic/src/sequential-multi/PuRd.js
var scheme16 = new Array(3).concat(
  "e7e1efc994c7dd1c77",
  "f1eef6d7b5d8df65b0ce1256",
  "f1eef6d7b5d8df65b0dd1c77980043",
  "f1eef6d4b9dac994c7df65b0dd1c77980043",
  "f1eef6d4b9dac994c7df65b0e7298ace125691003f",
  "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125691003f",
  "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f"
).map(colors_default);
var PuRd_default = ramp_default(scheme16);

// node_modules/d3-scale-chromatic/src/sequential-multi/RdPu.js
var scheme17 = new Array(3).concat(
  "fde0ddfa9fb5c51b8a",
  "feebe2fbb4b9f768a1ae017e",
  "feebe2fbb4b9f768a1c51b8a7a0177",
  "feebe2fcc5c0fa9fb5f768a1c51b8a7a0177",
  "feebe2fcc5c0fa9fb5f768a1dd3497ae017e7a0177",
  "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a0177",
  "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a"
).map(colors_default);
var RdPu_default = ramp_default(scheme17);

// node_modules/d3-scale-chromatic/src/sequential-multi/YlGnBu.js
var scheme18 = new Array(3).concat(
  "edf8b17fcdbb2c7fb8",
  "ffffcca1dab441b6c4225ea8",
  "ffffcca1dab441b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58"
).map(colors_default);
var YlGnBu_default = ramp_default(scheme18);

// node_modules/d3-scale-chromatic/src/sequential-multi/YlGn.js
var scheme19 = new Array(3).concat(
  "f7fcb9addd8e31a354",
  "ffffccc2e69978c679238443",
  "ffffccc2e69978c67931a354006837",
  "ffffccd9f0a3addd8e78c67931a354006837",
  "ffffccd9f0a3addd8e78c67941ab5d238443005a32",
  "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443005a32",
  "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529"
).map(colors_default);
var YlGn_default = ramp_default(scheme19);

// node_modules/d3-scale-chromatic/src/sequential-multi/YlOrBr.js
var scheme20 = new Array(3).concat(
  "fff7bcfec44fd95f0e",
  "ffffd4fed98efe9929cc4c02",
  "ffffd4fed98efe9929d95f0e993404",
  "ffffd4fee391fec44ffe9929d95f0e993404",
  "ffffd4fee391fec44ffe9929ec7014cc4c028c2d04",
  "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c028c2d04",
  "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506"
).map(colors_default);
var YlOrBr_default = ramp_default(scheme20);

// node_modules/d3-scale-chromatic/src/sequential-multi/YlOrRd.js
var scheme21 = new Array(3).concat(
  "ffeda0feb24cf03b20",
  "ffffb2fecc5cfd8d3ce31a1c",
  "ffffb2fecc5cfd8d3cf03b20bd0026",
  "ffffb2fed976feb24cfd8d3cf03b20bd0026",
  "ffffb2fed976feb24cfd8d3cfc4e2ae31a1cb10026",
  "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cb10026",
  "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026"
).map(colors_default);
var YlOrRd_default = ramp_default(scheme21);

// node_modules/d3-scale-chromatic/src/sequential-single/Blues.js
var scheme22 = new Array(3).concat(
  "deebf79ecae13182bd",
  "eff3ffbdd7e76baed62171b5",
  "eff3ffbdd7e76baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b"
).map(colors_default);
var Blues_default = ramp_default(scheme22);

// node_modules/d3-scale-chromatic/src/sequential-single/Greens.js
var scheme23 = new Array(3).concat(
  "e5f5e0a1d99b31a354",
  "edf8e9bae4b374c476238b45",
  "edf8e9bae4b374c47631a354006d2c",
  "edf8e9c7e9c0a1d99b74c47631a354006d2c",
  "edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32",
  "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32",
  "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b"
).map(colors_default);
var Greens_default = ramp_default(scheme23);

// node_modules/d3-scale-chromatic/src/sequential-single/Greys.js
var scheme24 = new Array(3).concat(
  "f0f0f0bdbdbd636363",
  "f7f7f7cccccc969696525252",
  "f7f7f7cccccc969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000"
).map(colors_default);
var Greys_default = ramp_default(scheme24);

// node_modules/d3-scale-chromatic/src/sequential-single/Purples.js
var scheme25 = new Array(3).concat(
  "efedf5bcbddc756bb1",
  "f2f0f7cbc9e29e9ac86a51a3",
  "f2f0f7cbc9e29e9ac8756bb154278f",
  "f2f0f7dadaebbcbddc9e9ac8756bb154278f",
  "f2f0f7dadaebbcbddc9e9ac8807dba6a51a34a1486",
  "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a34a1486",
  "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d"
).map(colors_default);
var Purples_default = ramp_default(scheme25);

// node_modules/d3-scale-chromatic/src/sequential-single/Reds.js
var scheme26 = new Array(3).concat(
  "fee0d2fc9272de2d26",
  "fee5d9fcae91fb6a4acb181d",
  "fee5d9fcae91fb6a4ade2d26a50f15",
  "fee5d9fcbba1fc9272fb6a4ade2d26a50f15",
  "fee5d9fcbba1fc9272fb6a4aef3b2ccb181d99000d",
  "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181d99000d",
  "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d"
).map(colors_default);
var Reds_default = ramp_default(scheme26);

// node_modules/d3-scale-chromatic/src/sequential-single/Oranges.js
var scheme27 = new Array(3).concat(
  "fee6cefdae6be6550d",
  "feeddefdbe85fd8d3cd94701",
  "feeddefdbe85fd8d3ce6550da63603",
  "feeddefdd0a2fdae6bfd8d3ce6550da63603",
  "feeddefdd0a2fdae6bfd8d3cf16913d948018c2d04",
  "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d948018c2d04",
  "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704"
).map(colors_default);
var Oranges_default = ramp_default(scheme27);

// node_modules/d3-scale-chromatic/src/sequential-multi/cividis.js
function cividis_default(t9) {
  t9 = Math.max(0, Math.min(1, t9));
  return "rgb(" + Math.max(0, Math.min(255, Math.round(-4.54 - t9 * (35.34 - t9 * (2381.73 - t9 * (6402.7 - t9 * (7024.72 - t9 * 2710.57))))))) + ", " + Math.max(0, Math.min(255, Math.round(32.49 + t9 * (170.73 + t9 * (52.82 - t9 * (131.46 - t9 * (176.58 - t9 * 67.37))))))) + ", " + Math.max(0, Math.min(255, Math.round(81.24 + t9 * (442.36 - t9 * (2482.43 - t9 * (6167.24 - t9 * (6614.94 - t9 * 2475.67))))))) + ")";
}

// node_modules/d3-scale-chromatic/src/sequential-multi/cubehelix.js
var cubehelix_default2 = cubehelixLong(cubehelix(300, 0.5, 0), cubehelix(-240, 0.5, 1));

// node_modules/d3-scale-chromatic/src/sequential-multi/rainbow.js
var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.5, 0.8));
var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.5, 0.8));
var c6 = cubehelix();
function rainbow_default(t9) {
  if (t9 < 0 || t9 > 1) t9 -= Math.floor(t9);
  var ts2 = Math.abs(t9 - 0.5);
  c6.h = 360 * t9 - 100;
  c6.s = 1.5 - 1.5 * ts2;
  c6.l = 0.8 - 0.9 * ts2;
  return c6 + "";
}

// node_modules/d3-scale-chromatic/src/sequential-multi/sinebow.js
var c7 = rgb2();
var pi_1_3 = Math.PI / 3;
var pi_2_3 = Math.PI * 2 / 3;
function sinebow_default(t9) {
  var x3;
  t9 = (0.5 - t9) * Math.PI;
  c7.r = 255 * (x3 = Math.sin(t9)) * x3;
  c7.g = 255 * (x3 = Math.sin(t9 + pi_1_3)) * x3;
  c7.b = 255 * (x3 = Math.sin(t9 + pi_2_3)) * x3;
  return c7 + "";
}

// node_modules/d3-scale-chromatic/src/sequential-multi/turbo.js
function turbo_default(t9) {
  t9 = Math.max(0, Math.min(1, t9));
  return "rgb(" + Math.max(0, Math.min(255, Math.round(34.61 + t9 * (1172.33 - t9 * (10793.56 - t9 * (33300.12 - t9 * (38394.49 - t9 * 14825.05))))))) + ", " + Math.max(0, Math.min(255, Math.round(23.31 + t9 * (557.33 + t9 * (1225.33 - t9 * (3574.96 - t9 * (1073.77 + t9 * 707.56))))))) + ", " + Math.max(0, Math.min(255, Math.round(27.2 + t9 * (3211.1 - t9 * (15327.97 - t9 * (27814 - t9 * (22569.18 - t9 * 6838.66))))))) + ")";
}

// node_modules/d3-scale-chromatic/src/sequential-multi/viridis.js
function ramp(range2) {
  var n8 = range2.length;
  return function(t9) {
    return range2[Math.max(0, Math.min(n8 - 1, Math.floor(t9 * n8)))];
  };
}
var viridis_default = ramp(colors_default("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));
var magma = ramp(colors_default("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));
var inferno = ramp(colors_default("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));
var plasma = ramp(colors_default("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

// node_modules/@nivo/core/dist/nivo-core.mjs
var import_last = __toESM(require_last(), 1);
var import_isArray = __toESM(require_isArray(), 1);
var import_isFunction = __toESM(require_isFunction(), 1);
var import_get2 = __toESM(require_get(), 1);
var import_isPlainObject = __toESM(require_isPlainObject(), 1);
var import_pick = __toESM(require_pick(), 1);
var import_isEqual = __toESM(require_isEqual(), 1);
var import_set2 = __toESM(require_set(), 1);
var Sr = (0, import_react18.createContext)();
var qr = function(e11) {
  var t9 = e11.children, n8 = e11.animate, o5 = void 0 === n8 || n8, i7 = e11.config, a6 = void 0 === i7 ? "default" : i7, l5 = (0, import_react18.useMemo)((function() {
    var e12 = (0, import_isString.default)(a6) ? config[a6] : a6;
    return { animate: o5, config: e12 };
  }), [o5, a6]);
  return (0, import_jsx_runtime2.jsx)(Sr.Provider, { value: l5, children: t9 });
};
var Dr = function() {
  return (0, import_react18.useContext)(Sr);
};
var Er = function(e11) {
  var r7 = e11.children, t9 = e11.condition, o5 = e11.wrapper;
  return t9 ? (0, import_react18.cloneElement)(o5, {}, r7) : r7;
};
var Ur = { position: "relative" };
var Fr = function(e11) {
  var r7 = e11.children, t9 = e11.theme, n8 = e11.renderWrapper, i7 = void 0 === n8 || n8, a6 = e11.isInteractive, l5 = void 0 === a6 || a6, d5 = e11.animate, u5 = e11.motionConfig, c10 = (0, import_react18.useRef)(null);
  return (0, import_jsx_runtime2.jsx)(z, { theme: t9, children: (0, import_jsx_runtime2.jsx)(qr, { animate: d5, config: u5, children: (0, import_jsx_runtime2.jsx)(W2, { container: c10, children: (0, import_jsx_runtime2.jsxs)(Er, { condition: i7, wrapper: (0, import_jsx_runtime2.jsx)("div", { style: Ur, ref: c10 }), children: [r7, l5 && (0, import_jsx_runtime2.jsx)(M2, {})] }) }) }) });
};
var Kr = function(e11, r7) {
  return e11.width === r7.width && e11.height === r7.height;
};
var Nr = function(e11) {
  var r7 = e11.children, t9 = e11.width, n8 = e11.height, o5 = e11.onResize, i7 = e11.debounceResize, l5 = a({ width: t9, height: n8 }, i7, { equalityFn: Kr })[0];
  return (0, import_react18.useEffect)((function() {
    null == o5 || o5(l5);
  }), [l5, o5]), (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: r7(l5) });
};
var $r = function(e11) {
  var r7 = e11.children, t9 = e11.defaultWidth, n8 = e11.defaultHeight, o5 = e11.onResize, i7 = e11.debounceResize, a6 = void 0 === i7 ? 0 : i7;
  return (0, import_jsx_runtime2.jsx)(AutoSizer, { defaultWidth: t9, defaultHeight: n8, children: function(e12) {
    var t10 = e12.width, n9 = e12.height;
    return (0, import_jsx_runtime2.jsx)(Nr, { width: t10, height: n9, onResize: o5, debounceResize: a6, children: r7 });
  } });
};
function Jr(e11, r7) {
  (null == r7 || r7 > e11.length) && (r7 = e11.length);
  for (var t9 = 0, n8 = Array(r7); t9 < r7; t9++) n8[t9] = e11[t9];
  return n8;
}
function Qr(e11, r7) {
  var t9 = "undefined" != typeof Symbol && e11[Symbol.iterator] || e11["@@iterator"];
  if (t9) return (t9 = t9.call(e11)).next.bind(t9);
  if (Array.isArray(e11) || (t9 = (function(e12, r8) {
    if (e12) {
      if ("string" == typeof e12) return Jr(e12, r8);
      var t10 = {}.toString.call(e12).slice(8, -1);
      return "Object" === t10 && e12.constructor && (t10 = e12.constructor.name), "Map" === t10 || "Set" === t10 ? Array.from(e12) : "Arguments" === t10 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t10) ? Jr(e12, r8) : void 0;
    }
  })(e11)) || r7 && e11 && "number" == typeof e11.length) {
    t9 && (e11 = t9);
    var n8 = 0;
    return function() {
      return n8 >= e11.length ? { done: true } : { done: false, value: e11[n8++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Vr() {
  return Vr = Object.assign ? Object.assign.bind() : function(e11) {
    for (var r7 = 1; r7 < arguments.length; r7++) {
      var t9 = arguments[r7];
      for (var n8 in t9) ({}).hasOwnProperty.call(t9, n8) && (e11[n8] = t9[n8]);
    }
    return e11;
  }, Vr.apply(null, arguments);
}
function Zr(e11, r7) {
  if (null == e11) return {};
  var t9 = {};
  for (var n8 in e11) if ({}.hasOwnProperty.call(e11, n8)) {
    if (-1 !== r7.indexOf(n8)) continue;
    t9[n8] = e11[n8];
  }
  return t9;
}
var rt = ["id", "colors"];
var tt = function(e11) {
  var r7 = e11.id, t9 = e11.colors, n8 = Zr(e11, rt);
  return (0, import_jsx_runtime2.jsx)("linearGradient", Vr({ id: r7, x1: 0, x2: 0, y1: 0, y2: 1 }, n8, { children: t9.map((function(e12) {
    var r8 = e12.offset, t10 = e12.color, n9 = e12.opacity;
    return (0, import_jsx_runtime2.jsx)("stop", { offset: r8 + "%", stopColor: t10, stopOpacity: void 0 !== n9 ? n9 : 1 }, r8);
  })) }));
};
var ot = { linearGradient: tt };
var it = { color: "#000000", background: "#ffffff", size: 4, padding: 4, stagger: false };
var at = (0, import_react18.memo)((function(e11) {
  var r7 = e11.id, t9 = e11.background, n8 = void 0 === t9 ? it.background : t9, o5 = e11.color, i7 = void 0 === o5 ? it.color : o5, a6 = e11.size, l5 = void 0 === a6 ? it.size : a6, d5 = e11.padding, u5 = void 0 === d5 ? it.padding : d5, c10 = e11.stagger, s6 = void 0 === c10 ? it.stagger : c10, f2 = l5 + u5, h2 = l5 / 2, p4 = u5 / 2;
  return true === s6 && (f2 = 2 * l5 + 2 * u5), (0, import_jsx_runtime2.jsxs)("pattern", { id: r7, width: f2, height: f2, patternUnits: "userSpaceOnUse", children: [(0, import_jsx_runtime2.jsx)("rect", { width: f2, height: f2, fill: n8 }), (0, import_jsx_runtime2.jsx)("circle", { cx: p4 + h2, cy: p4 + h2, r: h2, fill: i7 }), s6 && (0, import_jsx_runtime2.jsx)("circle", { cx: 1.5 * u5 + l5 + h2, cy: 1.5 * u5 + l5 + h2, r: h2, fill: i7 })] });
}));
var dt = 2 * Math.PI;
var ut = function(e11) {
  return e11 * Math.PI / 180;
};
var ct = function(e11) {
  return 180 * e11 / Math.PI;
};
var ft = function(e11, r7) {
  return { x: Math.cos(e11) * r7, y: Math.sin(e11) * r7 };
};
var ht = function(e11) {
  var r7 = e11 % 360;
  return r7 < 0 && (r7 += 360), r7;
};
var gt = { svg: { align: { left: "start", center: "middle", right: "end", start: "start", middle: "middle", end: "end" }, baseline: { top: "text-before-edge", center: "central", bottom: "alphabetic" } }, canvas: { align: { left: "left", center: "center", right: "right", start: "left", middle: "center", end: "right" }, baseline: { top: "top", center: "middle", bottom: "bottom" } } };
var mt = { spacing: 5, rotation: 0, background: "#000000", color: "#ffffff", lineWidth: 2 };
var vt = (0, import_react18.memo)((function(e11) {
  var r7 = e11.id, t9 = e11.spacing, n8 = void 0 === t9 ? mt.spacing : t9, o5 = e11.rotation, i7 = void 0 === o5 ? mt.rotation : o5, a6 = e11.background, l5 = void 0 === a6 ? mt.background : a6, d5 = e11.color, u5 = void 0 === d5 ? mt.color : d5, c10 = e11.lineWidth, s6 = void 0 === c10 ? mt.lineWidth : c10, f2 = Math.round(i7) % 360, h2 = Math.abs(n8);
  f2 > 180 ? f2 -= 360 : f2 > 90 ? f2 -= 180 : f2 < -180 ? f2 += 360 : f2 < -90 && (f2 += 180);
  var p4, g2 = h2, b6 = h2;
  return 0 === f2 ? p4 = "\n                M 0 0 L " + g2 + " 0\n                M 0 " + b6 + " L " + g2 + " " + b6 + "\n            " : 90 === f2 ? p4 = "\n                M 0 0 L 0 " + b6 + "\n                M " + g2 + " 0 L " + g2 + " " + b6 + "\n            " : (g2 = Math.abs(h2 / Math.sin(ut(f2))), b6 = h2 / Math.sin(ut(90 - f2)), p4 = f2 > 0 ? "\n                    M 0 " + -b6 + " L " + 2 * g2 + " " + b6 + "\n                    M " + -g2 + " " + -b6 + " L " + g2 + " " + b6 + "\n                    M " + -g2 + " 0 L " + g2 + " " + 2 * b6 + "\n                " : "\n                    M " + -g2 + " " + b6 + " L " + g2 + " " + -b6 + "\n                    M " + -g2 + " " + 2 * b6 + " L " + 2 * g2 + " " + -b6 + "\n                    M 0 " + 2 * b6 + " L " + 2 * g2 + " 0\n                "), (0, import_jsx_runtime2.jsxs)("pattern", { id: r7, width: g2, height: b6, patternUnits: "userSpaceOnUse", children: [(0, import_jsx_runtime2.jsx)("rect", { width: g2, height: b6, fill: l5, stroke: "rgba(255, 0, 0, 0.1)", strokeWidth: 0 }), (0, import_jsx_runtime2.jsx)("path", { d: p4, strokeWidth: s6, stroke: u5, strokeLinecap: "square" })] });
}));
var _t = { color: "#000000", background: "#ffffff", size: 4, padding: 4, stagger: false };
var wt = (0, import_react18.memo)((function(e11) {
  var r7 = e11.id, t9 = e11.color, n8 = void 0 === t9 ? _t.color : t9, o5 = e11.background, i7 = void 0 === o5 ? _t.background : o5, a6 = e11.size, l5 = void 0 === a6 ? _t.size : a6, d5 = e11.padding, u5 = void 0 === d5 ? _t.padding : d5, c10 = e11.stagger, s6 = void 0 === c10 ? _t.stagger : c10, f2 = l5 + u5, h2 = u5 / 2;
  return true === s6 && (f2 = 2 * l5 + 2 * u5), (0, import_jsx_runtime2.jsxs)("pattern", { id: r7, width: f2, height: f2, patternUnits: "userSpaceOnUse", children: [(0, import_jsx_runtime2.jsx)("rect", { width: f2, height: f2, fill: i7 }), (0, import_jsx_runtime2.jsx)("rect", { x: h2, y: h2, width: l5, height: l5, fill: n8 }), s6 && (0, import_jsx_runtime2.jsx)("rect", { x: 1.5 * u5 + l5, y: 1.5 * u5 + l5, width: l5, height: l5, fill: n8 })] });
}));
var xt = { patternDots: at, patternLines: vt, patternSquares: wt };
var Ot = ["type"];
var zt = Vr({}, ot, xt);
var Mt = (0, import_react18.memo)((function(e11) {
  var r7 = e11.defs;
  return !r7 || r7.length < 1 ? null : (0, import_jsx_runtime2.jsx)("defs", { "aria-hidden": true, children: r7.map((function(e12) {
    var r8 = e12.type, t9 = Zr(e12, Ot);
    return zt[r8] ? (0, import_react18.createElement)(zt[r8], Vr({ key: t9.id }, t9)) : null;
  })) });
}));
var Rt = (0, import_react18.forwardRef)((function(e11, r7) {
  var t9 = e11.width, n8 = e11.height, o5 = e11.margin, i7 = e11.defs, a6 = e11.children, l5 = e11.role, d5 = e11.ariaLabel, u5 = e11.ariaLabelledBy, c10 = e11.ariaDescribedBy, s6 = e11.isFocusable, f2 = M();
  return (0, import_jsx_runtime2.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", width: t9, height: n8, role: l5, "aria-label": d5, "aria-labelledby": u5, "aria-describedby": c10, focusable: s6, tabIndex: s6 ? 0 : void 0, ref: r7, children: [(0, import_jsx_runtime2.jsx)(Mt, { defs: i7 }), (0, import_jsx_runtime2.jsx)("rect", { width: t9, height: n8, fill: f2.background }), (0, import_jsx_runtime2.jsx)("g", { transform: "translate(" + o5.left + "," + o5.top + ")", children: a6 })] });
}));
var jt = (0, import_react18.memo)((function(e11) {
  var r7 = e11.size, t9 = e11.color, n8 = e11.borderWidth, o5 = e11.borderColor;
  return (0, import_jsx_runtime2.jsx)("circle", { r: r7 / 2, fill: t9, stroke: o5, strokeWidth: n8, style: { pointerEvents: "none" } });
}));
var Ct = (0, import_react18.memo)((function(e11) {
  var r7 = e11.x, t9 = e11.y, n8 = e11.symbol, o5 = void 0 === n8 ? jt : n8, a6 = e11.size, l5 = e11.datum, u5 = e11.color, c10 = e11.borderWidth, s6 = e11.borderColor, f2 = e11.label, h2 = e11.labelTextAnchor, p4 = void 0 === h2 ? "middle" : h2, g2 = e11.labelYOffset, b6 = void 0 === g2 ? -12 : g2, m3 = e11.ariaLabel, _3 = e11.ariaLabelledBy, w4 = e11.ariaDescribedBy, O5 = e11.ariaHidden, R4 = e11.ariaDisabled, j5 = e11.isFocusable, C6 = void 0 !== j5 && j5, B4 = e11.tabIndex, P4 = void 0 === B4 ? 0 : B4, W5 = e11.onFocus, G = e11.onBlur, I = e11.testId, A5 = M(), L4 = Dr(), S4 = L4.animate, Y3 = L4.config, q2 = useSpring({ transform: "translate(" + r7 + ", " + t9 + ")", config: Y3, immediate: !S4 }), D3 = (0, import_react18.useCallback)((function(e12) {
    null == W5 || W5(l5, e12);
  }), [W5, l5]), E5 = (0, import_react18.useCallback)((function(e12) {
    null == G || G(l5, e12);
  }), [G, l5]);
  return (0, import_jsx_runtime2.jsxs)(animated.g, { transform: q2.transform, style: { pointerEvents: "none" }, focusable: C6, tabIndex: C6 ? P4 : void 0, "aria-label": m3, "aria-labelledby": _3, "aria-describedby": w4, "aria-disabled": R4, "aria-hidden": O5, onFocus: C6 && W5 ? D3 : void 0, onBlur: C6 && G ? E5 : void 0, "data-testid": I, children: [(0, import_react18.createElement)(o5, { size: a6, color: u5, datum: l5, borderWidth: c10, borderColor: s6 }), f2 && (0, import_jsx_runtime2.jsx)("text", { textAnchor: p4, y: b6, style: b(A5.dots.text), children: f2 })] });
}));
var Bt = (0, import_react18.memo)((function(e11) {
  var r7 = e11.width, t9 = e11.height, n8 = e11.axis, o5 = e11.scale, i7 = e11.value, a6 = e11.lineStyle, l5 = e11.textStyle, d5 = e11.legend, u5 = e11.legendNode, c10 = e11.legendPosition, s6 = void 0 === c10 ? "top-right" : c10, f2 = e11.legendOffsetX, h2 = void 0 === f2 ? 14 : f2, p4 = e11.legendOffsetY, g2 = void 0 === p4 ? 14 : p4, b6 = e11.legendOrientation, m3 = void 0 === b6 ? "horizontal" : b6, y5 = M(), _3 = 0, w4 = 0, k4 = 0, x3 = 0;
  if ("y" === n8 ? (k4 = o5(i7), w4 = r7) : (_3 = o5(i7), x3 = t9), d5 && !u5) {
    var O5 = (function(e12) {
      var r8 = e12.axis, t10 = e12.width, n9 = e12.height, o6 = e12.position, i8 = e12.offsetX, a7 = e12.offsetY, l6 = e12.orientation, d6 = 0, u6 = 0, c11 = "vertical" === l6 ? -90 : 0, s7 = "start";
      if ("x" === r8) switch (o6) {
        case "top-left":
          d6 = -i8, u6 = a7, s7 = "end";
          break;
        case "top":
          u6 = -a7, s7 = "horizontal" === l6 ? "middle" : "start";
          break;
        case "top-right":
          d6 = i8, u6 = a7, s7 = "horizontal" === l6 ? "start" : "end";
          break;
        case "right":
          d6 = i8, u6 = n9 / 2, s7 = "horizontal" === l6 ? "start" : "middle";
          break;
        case "bottom-right":
          d6 = i8, u6 = n9 - a7, s7 = "start";
          break;
        case "bottom":
          u6 = n9 + a7, s7 = "horizontal" === l6 ? "middle" : "end";
          break;
        case "bottom-left":
          u6 = n9 - a7, d6 = -i8, s7 = "horizontal" === l6 ? "end" : "start";
          break;
        case "left":
          d6 = -i8, u6 = n9 / 2, s7 = "horizontal" === l6 ? "end" : "middle";
      }
      else switch (o6) {
        case "top-left":
          d6 = i8, u6 = -a7, s7 = "start";
          break;
        case "top":
          d6 = t10 / 2, u6 = -a7, s7 = "horizontal" === l6 ? "middle" : "start";
          break;
        case "top-right":
          d6 = t10 - i8, u6 = -a7, s7 = "horizontal" === l6 ? "end" : "start";
          break;
        case "right":
          d6 = t10 + i8, s7 = "horizontal" === l6 ? "start" : "middle";
          break;
        case "bottom-right":
          d6 = t10 - i8, u6 = a7, s7 = "end";
          break;
        case "bottom":
          d6 = t10 / 2, u6 = a7, s7 = "horizontal" === l6 ? "middle" : "end";
          break;
        case "bottom-left":
          d6 = i8, u6 = a7, s7 = "horizontal" === l6 ? "start" : "end";
          break;
        case "left":
          d6 = -i8, s7 = "horizontal" === l6 ? "end" : "middle";
      }
      return { x: d6, y: u6, rotation: c11, textAnchor: s7 };
    })({ axis: n8, width: r7, height: t9, position: s6, offsetX: h2, offsetY: g2, orientation: m3 });
    u5 = (0, import_jsx_runtime2.jsx)("text", { transform: "translate(" + O5.x + ", " + O5.y + ") rotate(" + O5.rotation + ")", textAnchor: O5.textAnchor, dominantBaseline: "central", style: l5, children: d5 });
  }
  return (0, import_jsx_runtime2.jsxs)("g", { transform: "translate(" + _3 + ", " + k4 + ")", children: [(0, import_jsx_runtime2.jsx)("line", { x1: 0, x2: w4, y1: 0, y2: x3, stroke: y5.markers.lineColor, strokeWidth: y5.markers.lineStrokeWidth, style: a6 }), u5] });
}));
var Pt = (0, import_react18.memo)((function(e11) {
  var r7 = e11.markers, t9 = e11.width, n8 = e11.height, o5 = e11.xScale, i7 = e11.yScale;
  return r7 && 0 !== r7.length ? r7.map((function(e12, r8) {
    return (0, import_jsx_runtime2.jsx)(Bt, Vr({}, e12, { width: t9, height: n8, scale: "y" === e12.axis ? i7 : o5 }), r8);
  })) : null;
}));
var It = function(e11) {
  var t9 = Dr(), n8 = t9.animate, i7 = t9.config, l5 = (function(e12) {
    var r7 = (0, import_react18.useRef)();
    return (0, import_react18.useEffect)((function() {
      r7.current = e12;
    }), [e12]), r7.current;
  })(e11), d5 = (0, import_react18.useMemo)((function() {
    return string_default(l5, e11);
  }), [l5, e11]), u5 = useSpring({ from: { value: 0 }, to: { value: 1 }, reset: true, config: i7, immediate: !n8 }).value;
  return to2(u5, d5);
};
var At = (0, import_react18.createContext)(void 0);
var Lt = { basis: basis_default2, basisClosed: basisClosed_default2, basisOpen: basisOpen_default, bundle: bundle_default, cardinal: cardinal_default, cardinalClosed: cardinalClosed_default, cardinalOpen: cardinalOpen_default, catmullRom: catmullRom_default, catmullRomClosed: catmullRomClosed_default, catmullRomOpen: catmullRomOpen_default, linear: linear_default, linearClosed: linearClosed_default, monotoneX, monotoneY, natural: natural_default, step: step_default, stepAfter, stepBefore };
var St = Object.keys(Lt);
var Yt = St.filter((function(e11) {
  return e11.endsWith("Closed");
}));
var qt = (0, import_without.default)(St, "bundle", "basisClosed", "basisOpen", "cardinalClosed", "cardinalOpen", "catmullRomClosed", "catmullRomOpen", "linearClosed");
var Dt = (0, import_without.default)(St, "bundle", "basisClosed", "basisOpen", "cardinalClosed", "cardinalOpen", "catmullRomClosed", "catmullRomOpen", "linearClosed");
var Et = function(e11) {
  if (!Lt[e11]) throw new TypeError("'" + e11 + "', is not a valid curve interpolator identifier.");
  return Lt[e11];
};
var Ut = { ascending: ascending_default, descending: descending_default2, insideOut: insideOut_default, none: none_default2, reverse: reverse_default };
var Ft = Object.keys(Ut);
var Ht = { expand: expand_default, diverging: diverging_default, none: none_default, silhouette: silhouette_default, wiggle: wiggle_default };
var Xt = Object.keys(Ht);
var Jt = { nivo: ["#d76445", "#f47560", "#e8c1a0", "#97e3d5", "#61cdbb", "#00b0a7"], BrBG: (0, import_last.default)(scheme), PRGn: (0, import_last.default)(scheme2), PiYG: (0, import_last.default)(scheme3), PuOr: (0, import_last.default)(scheme4), RdBu: (0, import_last.default)(scheme5), RdGy: (0, import_last.default)(scheme6), RdYlBu: (0, import_last.default)(scheme7), RdYlGn: (0, import_last.default)(scheme8), spectral: (0, import_last.default)(scheme9), blues: (0, import_last.default)(scheme22), greens: (0, import_last.default)(scheme23), greys: (0, import_last.default)(scheme24), oranges: (0, import_last.default)(scheme27), purples: (0, import_last.default)(scheme25), reds: (0, import_last.default)(scheme26), BuGn: (0, import_last.default)(scheme10), BuPu: (0, import_last.default)(scheme11), GnBu: (0, import_last.default)(scheme12), OrRd: (0, import_last.default)(scheme13), PuBuGn: (0, import_last.default)(scheme14), PuBu: (0, import_last.default)(scheme15), PuRd: (0, import_last.default)(scheme16), RdPu: (0, import_last.default)(scheme17), YlGnBu: (0, import_last.default)(scheme18), YlGn: (0, import_last.default)(scheme19), YlOrBr: (0, import_last.default)(scheme20), YlOrRd: (0, import_last.default)(scheme21) };
var Qt = Object.keys(Jt);
var Zt = { nivo: ["#e8c1a0", "#f47560", "#f1e15b", "#e8a838", "#61cdbb", "#97e3d5"], category10: category10_default, accent: Accent_default, dark2: Dark2_default, paired: Paired_default, pastel1: Pastel1_default, pastel2: Pastel2_default, set1: Set1_default, set2: Set2_default, set3: Set3_default, brown_blueGreen: (0, import_last.default)(scheme), purpleRed_green: (0, import_last.default)(scheme2), pink_yellowGreen: (0, import_last.default)(scheme3), purple_orange: (0, import_last.default)(scheme4), red_blue: (0, import_last.default)(scheme5), red_grey: (0, import_last.default)(scheme6), red_yellow_blue: (0, import_last.default)(scheme7), red_yellow_green: (0, import_last.default)(scheme8), spectral: (0, import_last.default)(scheme9), blues: (0, import_last.default)(scheme22), greens: (0, import_last.default)(scheme23), greys: (0, import_last.default)(scheme24), oranges: (0, import_last.default)(scheme27), purples: (0, import_last.default)(scheme25), reds: (0, import_last.default)(scheme26), blue_green: (0, import_last.default)(scheme10), blue_purple: (0, import_last.default)(scheme11), green_blue: (0, import_last.default)(scheme12), orange_red: (0, import_last.default)(scheme13), purple_blue_green: (0, import_last.default)(scheme14), purple_blue: (0, import_last.default)(scheme15), purple_red: (0, import_last.default)(scheme16), red_purple: (0, import_last.default)(scheme17), yellow_green_blue: (0, import_last.default)(scheme18), yellow_green: (0, import_last.default)(scheme19), yellow_orange_brown: (0, import_last.default)(scheme20), yellow_orange_red: (0, import_last.default)(scheme21) };
var dn = ordinal(Set3_default);
var un = { top: 0, right: 0, bottom: 0, left: 0 };
var cn = function(e11, t9, n8) {
  return void 0 === n8 && (n8 = {}), (0, import_react18.useMemo)((function() {
    var r7 = Vr({}, un, n8);
    return { margin: r7, innerWidth: e11 - r7.left - r7.right, innerHeight: t9 - r7.top - r7.bottom, outerWidth: e11, outerHeight: t9 };
  }), [e11, t9, n8]);
};
var sn = function() {
  var e11 = (0, import_react18.useRef)(null), r7 = (0, import_react18.useState)({ left: 0, top: 0, width: 0, height: 0 }), t9 = r7[0], n8 = r7[1], i7 = (0, import_react18.useState)((function() {
    return "undefined" == typeof ResizeObserver ? null : new ResizeObserver((function(e12) {
      var r8 = e12[0];
      return n8(r8.contentRect);
    }));
  }))[0];
  return (0, import_react18.useEffect)((function() {
    return e11.current && null !== i7 && i7.observe(e11.current), function() {
      null !== i7 && i7.disconnect();
    };
  }), [i7]), [e11, t9];
};
var fn = function(e11) {
  return "function" == typeof e11 ? e11 : "string" == typeof e11 ? 0 === e11.indexOf("time:") ? timeFormat(e11.slice("5")) : format(e11) : function(e12) {
    return "" + e12;
  };
};
var hn = function(e11) {
  return (0, import_react18.useMemo)((function() {
    return fn(e11);
  }), [e11]);
};
var pn = function(e11, r7) {
  var t9, n8 = (0, import_isFunction.default)(e11) ? e11 : function(r8) {
    return (0, import_get2.default)(r8, e11);
  };
  return r7 && (t9 = (0, import_isFunction.default)(r7) ? r7 : format(r7)), t9 ? function(e12) {
    return t9(n8(e12));
  } : n8;
};
var gn = function(e11) {
  return (0, import_isFunction.default)(e11) ? e11 : function(r7) {
    return (0, import_get2.default)(r7, e11);
  };
};
var bn = function(e11) {
  return (0, import_react18.useMemo)((function() {
    return gn(e11);
  }), [e11]);
};
var yn = function(e11, r7, t9, n8) {
  return Math.sqrt(Math.pow(t9 - e11, 2) + Math.pow(n8 - r7, 2));
};
var wn = function(e11, r7, t9, n8, o5, i7) {
  return e11 <= o5 && o5 <= e11 + t9 && r7 <= i7 && i7 <= r7 + n8;
};
var kn = function(e11, r7) {
  var t9, n8 = "touches" in r7 ? r7.touches[0] : r7, o5 = n8.clientX, i7 = n8.clientY, a6 = e11.getBoundingClientRect(), l5 = (t9 = void 0 !== e11.getBBox ? e11.getBBox() : { width: e11.offsetWidth || 0, height: e11.offsetHeight || 0 }).width === a6.width ? 1 : t9.width / a6.width;
  return [(o5 - a6.left) * l5, (i7 - a6.top) * l5];
};
var xn = Object.keys(ot);
var On = Object.keys(xt);
var zn = function(e11, r7, t9) {
  if ("*" === e11) return true;
  if ((0, import_isFunction.default)(e11)) return e11(r7);
  if ((0, import_isPlainObject.default)(e11)) {
    var n8 = t9 ? (0, import_get2.default)(r7, t9) : r7;
    return (0, import_isEqual.default)((0, import_pick.default)(n8, Object.keys(e11)), e11);
  }
  return false;
};
var Mn = function(e11, r7, t9, n8) {
  var o5 = void 0 === n8 ? {} : n8, i7 = o5.dataKey, a6 = o5.colorKey, l5 = void 0 === a6 ? "color" : a6, d5 = o5.targetKey, u5 = void 0 === d5 ? "fill" : d5, c10 = [], s6 = {};
  return e11.length && r7.length && (c10 = [].concat(e11), r7.forEach((function(r8) {
    for (var n9, o6 = function() {
      var t10 = n9.value, o7 = t10.id, a8 = t10.match;
      if (zn(a8, r8, i7)) {
        var d6 = e11.find((function(e12) {
          return e12.id === o7;
        }));
        if (d6) {
          if (On.includes(d6.type)) if ("inherit" === d6.background || "inherit" === d6.color) {
            var f2 = (0, import_get2.default)(r8, l5), h2 = d6.background, p4 = d6.color, g2 = o7;
            "inherit" === d6.background && (g2 = g2 + ".bg." + f2, h2 = f2), "inherit" === d6.color && (g2 = g2 + ".fg." + f2, p4 = f2), (0, import_set2.default)(r8, u5, "url(#" + g2 + ")"), s6[g2] || (c10.push(Vr({}, d6, { id: g2, background: h2, color: p4 })), s6[g2] = 1);
          } else (0, import_set2.default)(r8, u5, "url(#" + o7 + ")");
          else if (xn.includes(d6.type)) {
            if (d6.colors.map((function(e12) {
              return e12.color;
            })).includes("inherit")) {
              var b6 = (0, import_get2.default)(r8, l5), m3 = o7, v3 = Vr({}, d6, { colors: d6.colors.map((function(e12, r9) {
                return "inherit" !== e12.color ? e12 : (m3 = m3 + "." + r9 + "." + b6, Vr({}, e12, { color: "inherit" === e12.color ? b6 : e12.color }));
              })) });
              v3.id = m3, (0, import_set2.default)(r8, u5, "url(#" + m3 + ")"), s6[m3] || (c10.push(v3), s6[m3] = 1);
            } else (0, import_set2.default)(r8, u5, "url(#" + o7 + ")");
          }
        }
        return 1;
      }
    }, a7 = Qr(t9); !(n9 = a7()).done && !o6(); ) ;
  }))), c10;
};
function Rn() {
  for (var e11 = arguments.length, r7 = new Array(e11), t9 = 0; t9 < e11; t9++) r7[t9] = arguments[t9];
  return function(e12) {
    for (var t10 = 0, n8 = r7; t10 < n8.length; t10++) {
      var o5 = n8[t10];
      "function" == typeof o5 ? o5(e12) : null != o5 && (o5.current = e12);
    }
  };
}

// node_modules/@nivo/tooltip/dist/nivo-tooltip.mjs
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
function v() {
  return v = Object.assign ? Object.assign.bind() : function(t9) {
    for (var i7 = 1; i7 < arguments.length; i7++) {
      var n8 = arguments[i7];
      for (var o5 in n8) ({}).hasOwnProperty.call(n8, o5) && (t9[o5] = n8[o5]);
    }
    return t9;
  }, v.apply(null, arguments);
}
var x2 = ["basic", "chip", "container", "table", "tableCell", "tableCellValue"];
var m = { pointerEvents: "none", position: "absolute", zIndex: 10, top: 0, left: 0 };
var b2 = function(t9, i7) {
  return "translate(" + t9 + "px, " + i7 + "px)";
};
var g = (0, import_react19.memo)((function(t9) {
  var n8, o5 = t9.position, r7 = t9.anchor, e11 = t9.children, l5 = M(), u5 = Dr(), y5 = u5.animate, f2 = u5.config, g2 = sn(), w4 = g2[0], T3 = g2[1], C6 = (0, import_react19.useRef)(false), E5 = void 0, P4 = false, V3 = T3.width > 0 && T3.height > 0, O5 = Math.round(o5[0]), N2 = Math.round(o5[1]);
  V3 && ("top" === r7 ? (O5 -= T3.width / 2, N2 -= T3.height + 14) : "right" === r7 ? (O5 += 14, N2 -= T3.height / 2) : "bottom" === r7 ? (O5 -= T3.width / 2, N2 += 14) : "left" === r7 ? (O5 -= T3.width + 14, N2 -= T3.height / 2) : "center" === r7 && (O5 -= T3.width / 2, N2 -= T3.height / 2), E5 = { transform: b2(O5, N2) }, C6.current || (P4 = true), C6.current = [O5, N2]);
  var j5 = useSpring({ to: E5, config: f2, immediate: !y5 || P4 }), k4 = l5.tooltip;
  k4.basic, k4.chip, k4.container, k4.table, k4.tableCell, k4.tableCellValue;
  var z6 = (function(t10, i7) {
    if (null == t10) return {};
    var n9 = {};
    for (var o6 in t10) if ({}.hasOwnProperty.call(t10, o6)) {
      if (-1 !== i7.indexOf(o6)) continue;
      n9[o6] = t10[o6];
    }
    return n9;
  })(k4, x2), A5 = v({}, m, z6, { transform: null != (n8 = j5.transform) ? n8 : b2(O5, N2), opacity: j5.transform ? 1 : 0 });
  return (0, import_jsx_runtime3.jsx)(animated.div, { ref: w4, style: A5, children: e11 });
}));
g.displayName = "TooltipWrapper";
var w2 = (0, import_react19.memo)((function(t9) {
  var i7 = t9.size, n8 = void 0 === i7 ? 12 : i7, o5 = t9.color, r7 = t9.style;
  return (0, import_jsx_runtime3.jsx)("span", { style: v({ display: "block", width: n8, height: n8, background: o5 }, void 0 === r7 ? {} : r7) });
}));
var T = (0, import_react19.memo)((function(t9) {
  var i7, n8 = t9.id, o5 = t9.value, r7 = t9.format, e11 = t9.enableChip, l5 = void 0 !== e11 && e11, a6 = t9.color, c10 = t9.renderContent, s6 = M(), h2 = hn(r7);
  if ("function" == typeof c10) i7 = c10();
  else {
    var f2 = o5;
    void 0 !== h2 && void 0 !== f2 && (f2 = h2(f2)), i7 = (0, import_jsx_runtime3.jsxs)("div", { style: s6.tooltip.basic, children: [l5 && (0, import_jsx_runtime3.jsx)(w2, { color: a6, style: s6.tooltip.chip }), void 0 !== f2 ? (0, import_jsx_runtime3.jsxs)("span", { children: [n8, ": ", (0, import_jsx_runtime3.jsx)("strong", { children: "" + f2 })] }) : n8] });
  }
  return (0, import_jsx_runtime3.jsx)("div", { style: s6.tooltip.container, role: "tooltip", children: i7 });
}));
var C3 = { width: "100%", borderCollapse: "collapse" };
var E2 = (0, import_react19.memo)((function(t9) {
  var i7, n8 = t9.title, o5 = t9.rows, r7 = void 0 === o5 ? [] : o5, e11 = t9.renderContent, l5 = M();
  return r7.length ? (i7 = "function" == typeof e11 ? e11() : (0, import_jsx_runtime3.jsxs)("div", { children: [n8 && n8, (0, import_jsx_runtime3.jsx)("table", { style: v({}, C3, l5.tooltip.table), children: (0, import_jsx_runtime3.jsx)("tbody", { children: r7.map((function(t10, i8) {
    return (0, import_jsx_runtime3.jsx)("tr", { children: t10.map((function(t11, i9) {
      return (0, import_jsx_runtime3.jsx)("td", { style: l5.tooltip.tableCell, children: t11 }, i9);
    })) }, i8);
  })) }) })] }), (0, import_jsx_runtime3.jsx)("div", { style: l5.tooltip.container, children: i7 })) : null;
}));
E2.displayName = "TableTooltip";
var P2 = (0, import_react19.memo)((function(t9) {
  var i7 = t9.x0, o5 = t9.x1, r7 = t9.y0, e11 = t9.y1, l5 = M(), h2 = Dr(), u5 = h2.animate, y5 = h2.config, f2 = (0, import_react19.useMemo)((function() {
    return v({}, l5.crosshair.line, { pointerEvents: "none" });
  }), [l5.crosshair.line]), x3 = useSpring({ x1: i7, x2: o5, y1: r7, y2: e11, config: y5, immediate: !u5 });
  return (0, import_jsx_runtime3.jsx)(animated.line, v({}, x3, { fill: "none", style: f2 }));
}));
P2.displayName = "CrosshairLine";
var V = (0, import_react19.memo)((function(t9) {
  var i7, n8, o5 = t9.width, r7 = t9.height, e11 = t9.type, l5 = t9.x, a6 = t9.y;
  return "cross" === e11 ? (i7 = { x0: l5, x1: l5, y0: 0, y1: r7 }, n8 = { x0: 0, x1: o5, y0: a6, y1: a6 }) : "top-left" === e11 ? (i7 = { x0: l5, x1: l5, y0: 0, y1: a6 }, n8 = { x0: 0, x1: l5, y0: a6, y1: a6 }) : "top" === e11 ? i7 = { x0: l5, x1: l5, y0: 0, y1: a6 } : "top-right" === e11 ? (i7 = { x0: l5, x1: l5, y0: 0, y1: a6 }, n8 = { x0: l5, x1: o5, y0: a6, y1: a6 }) : "right" === e11 ? n8 = { x0: l5, x1: o5, y0: a6, y1: a6 } : "bottom-right" === e11 ? (i7 = { x0: l5, x1: l5, y0: a6, y1: r7 }, n8 = { x0: l5, x1: o5, y0: a6, y1: a6 }) : "bottom" === e11 ? i7 = { x0: l5, x1: l5, y0: a6, y1: r7 } : "bottom-left" === e11 ? (i7 = { x0: l5, x1: l5, y0: a6, y1: r7 }, n8 = { x0: 0, x1: l5, y0: a6, y1: a6 }) : "left" === e11 ? n8 = { x0: 0, x1: l5, y0: a6, y1: a6 } : "x" === e11 ? i7 = { x0: l5, x1: l5, y0: 0, y1: r7 } : "y" === e11 && (n8 = { x0: 0, x1: o5, y0: a6, y1: a6 }), (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [i7 && (0, import_jsx_runtime3.jsx)(P2, { x0: i7.x0, x1: i7.x1, y0: i7.y0, y1: i7.y1 }), n8 && (0, import_jsx_runtime3.jsx)(P2, { x0: n8.x0, x1: n8.x1, y0: n8.y0, y1: n8.y1 })] });
}));
V.displayName = "Crosshair";
var O2 = (0, import_react19.createContext)({ showTooltipAt: function() {
}, showTooltipFromEvent: function() {
}, hideTooltip: function() {
} });
var N = { isVisible: false, position: [null, null], content: null, anchor: null };
var j2 = (0, import_react19.createContext)(N);
var k2 = function(t9) {
  var i7 = (0, import_react19.useState)(N), o5 = i7[0], l5 = i7[1], a6 = (0, import_react19.useCallback)((function(t10, i8, n8) {
    var o6 = i8[0], r7 = i8[1];
    void 0 === n8 && (n8 = "top"), l5({ isVisible: true, position: [o6, r7], anchor: n8, content: t10 });
  }), [l5]), c10 = (0, import_react19.useCallback)((function(i8, n8, o6) {
    void 0 === o6 && (o6 = "top");
    var r7 = t9.current.getBoundingClientRect(), e11 = t9.current.offsetWidth, a7 = e11 === r7.width ? 1 : e11 / r7.width, c11 = "touches" in n8 ? n8.touches[0] : n8, s7 = c11.clientX, h2 = c11.clientY, u5 = (s7 - r7.left) * a7, d5 = (h2 - r7.top) * a7;
    "left" !== o6 && "right" !== o6 || (o6 = u5 < r7.width / 2 ? "right" : "left"), l5({ isVisible: true, position: [u5, d5], anchor: o6, content: i8 });
  }), [t9, l5]), s6 = (0, import_react19.useCallback)((function() {
    l5(N);
  }), [l5]);
  return { actions: (0, import_react19.useMemo)((function() {
    return { showTooltipAt: a6, showTooltipFromEvent: c10, hideTooltip: s6 };
  }), [a6, c10, s6]), state: o5 };
};
var z3 = function() {
  var t9 = (0, import_react19.useContext)(O2);
  if (void 0 === t9) throw new Error("useTooltip must be used within a TooltipProvider");
  return t9;
};
var A2 = function() {
  var t9 = (0, import_react19.useContext)(j2);
  if (void 0 === t9) throw new Error("useTooltipState must be used within a TooltipProvider");
  return t9;
};
var F = function(t9) {
  return t9.isVisible;
};
var M2 = function() {
  var t9 = A2();
  return F(t9) ? (0, import_jsx_runtime3.jsx)(g, { position: t9.position, anchor: t9.anchor, children: t9.content }) : null;
};
var W2 = function(t9) {
  var i7 = t9.container, n8 = t9.children, o5 = k2(i7), r7 = o5.actions, e11 = o5.state;
  return (0, import_jsx_runtime3.jsx)(O2.Provider, { value: r7, children: (0, import_jsx_runtime3.jsx)(j2.Provider, { value: e11, children: n8 }) });
};

// node_modules/@nivo/text/dist/nivo-text.mjs
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var a4 = function(t9, e11) {
  t9.font = (e11.fontWeight ? e11.fontWeight + " " : "") + e11.fontSize + "px " + e11.fontFamily;
};
var d3 = function(t9, e11, o5, n8, r7) {
  void 0 === n8 && (n8 = 0), void 0 === r7 && (r7 = 0), e11.outlineWidth > 0 && (t9.strokeStyle = e11.outlineColor, t9.lineWidth = 2 * e11.outlineWidth, t9.lineJoin = "round", t9.strokeText(o5, n8, r7)), t9.fillStyle = e11.fill, t9.fillText(o5, n8, r7);
};
function p2() {
  return p2 = Object.assign ? Object.assign.bind() : function(t9) {
    for (var e11 = 1; e11 < arguments.length; e11++) {
      var o5 = arguments[e11];
      for (var n8 in o5) ({}).hasOwnProperty.call(o5, n8) && (t9[n8] = o5[n8]);
    }
    return t9;
  }, p2.apply(null, arguments);
}
function s4(t9, e11) {
  if (null == t9) return {};
  var o5 = {};
  for (var n8 in t9) if ({}.hasOwnProperty.call(t9, n8)) {
    if (-1 !== e11.indexOf(n8)) continue;
    o5[n8] = t9[n8];
  }
  return o5;
}
var h = ["style", "children"];
var m2 = ["outlineWidth", "outlineColor", "outlineOpacity"];
var b3 = function(r7) {
  var i7 = r7.style, l5 = r7.children, c10 = s4(r7, h), f2 = i7.outlineWidth, u5 = i7.outlineColor, a6 = i7.outlineOpacity, d5 = s4(i7, m2);
  return (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [f2 > 0 && (0, import_jsx_runtime4.jsx)(animated.text, p2({}, c10, { style: p2({}, d5, { strokeWidth: 2 * f2, stroke: u5, strokeOpacity: a6, strokeLinejoin: "round" }), children: l5 })), (0, import_jsx_runtime4.jsx)(animated.text, p2({}, c10, { style: d5, children: l5 }))] });
};

// node_modules/@nivo/scales/dist/nivo-scales.mjs
var import_uniq = __toESM(require_uniq(), 1);
var import_uniqBy = __toESM(require_uniqBy(), 1);
var import_sortBy = __toESM(require_sortBy(), 1);
var import_last2 = __toESM(require_last(), 1);
var import_isDate = __toESM(require_isDate(), 1);
function J() {
  return J = Object.assign ? Object.assign.bind() : function(n8) {
    for (var t9 = 1; t9 < arguments.length; t9++) {
      var e11 = arguments[t9];
      for (var r7 in e11) ({}).hasOwnProperty.call(e11, r7) && (n8[r7] = e11[r7]);
    }
    return n8;
  }, J.apply(null, arguments);
}
var L2 = [function(n8) {
  return n8.setMilliseconds(0);
}, function(n8) {
  return n8.setSeconds(0);
}, function(n8) {
  return n8.setMinutes(0);
}, function(n8) {
  return n8.setHours(0);
}, function(n8) {
  return n8.setDate(1);
}, function(n8) {
  return n8.setMonth(0);
}];
var Q = { millisecond: [], second: L2.slice(0, 1), minute: L2.slice(0, 2), hour: L2.slice(0, 3), day: L2.slice(0, 4), month: L2.slice(0, 5), year: L2.slice(0, 6) };
var W3 = function(n8) {
  return function(t9) {
    return Q[n8].forEach((function(n9) {
      n9(t9);
    })), t9;
  };
};
var X = function(n8) {
  var t9 = n8.format, e11 = void 0 === t9 ? "native" : t9, r7 = n8.precision, i7 = void 0 === r7 ? "millisecond" : r7, u5 = n8.useUTC, c10 = void 0 === u5 || u5, s6 = W3(i7);
  return function(n9) {
    if (void 0 === n9) return n9;
    if ("native" === e11 || n9 instanceof Date) return s6(n9);
    var t10 = c10 ? utcParse(e11) : timeParse(e11);
    return s6(t10(n9));
  };
};
var Y = { type: "linear", min: 0, max: "auto", stacked: false, reverse: false, clamp: false, nice: true, round: false };
var Z = function(n8, t9, e11, r7) {
  var i7, a6, o5, c10, s6 = n8.min, d5 = void 0 === s6 ? Y.min : s6, m3 = n8.max, f2 = void 0 === m3 ? Y.max : m3, l5 = n8.stacked, y5 = void 0 === l5 ? Y.stacked : l5, h2 = n8.reverse, g2 = void 0 === h2 ? Y.reverse : h2, x3 = n8.clamp, k4 = void 0 === x3 ? Y.clamp : x3, T3 = n8.nice, b6 = void 0 === T3 ? Y.nice : T3, M4 = n8.round, w4 = void 0 === M4 ? Y.round : M4;
  "auto" === d5 ? i7 = true === y5 ? null != (a6 = t9.minStacked) ? a6 : 0 : t9.min : i7 = d5;
  "auto" === f2 ? o5 = true === y5 ? null != (c10 = t9.maxStacked) ? c10 : 0 : t9.max : o5 = f2;
  var E5 = linear2().range("x" === r7 ? [0, e11] : [e11, 0]).interpolate(w4 ? round_default : number_default).domain(g2 ? [o5, i7] : [i7, o5]).clamp(k4);
  return true === b6 ? E5.nice() : "number" == typeof b6 && E5.nice(b6), _2(E5, y5);
};
var _2 = function(n8, t9) {
  void 0 === t9 && (t9 = false);
  var e11 = n8;
  return e11.type = "linear", e11.stacked = t9, e11;
};
var nn = function(n8, t9, e11) {
  var r7 = point5().range([0, e11]).domain(t9.all);
  return r7.type = "point", r7;
};
var en = { type: "band", round: false };
var rn = function(n8, t9, e11, r7) {
  var i7 = n8.round, a6 = void 0 === i7 ? en.round : i7, o5 = band().range("x" === r7 ? [0, e11] : [e11, 0]).domain(t9.all).round(a6);
  return an(o5);
};
var an = function(n8) {
  var t9 = n8;
  return t9.type = "band", t9;
};
var on = { type: "time", format: "native", precision: "millisecond", min: "auto", max: "auto", useUTC: true, nice: false };
var un2 = function(n8, t9, e11) {
  var r7, i7, a6 = n8.format, o5 = void 0 === a6 ? on.format : a6, u5 = n8.precision, c10 = void 0 === u5 ? on.precision : u5, s6 = n8.min, f2 = void 0 === s6 ? on.min : s6, l5 = n8.max, v3 = void 0 === l5 ? on.max : l5, p4 = n8.useUTC, y5 = void 0 === p4 ? on.useUTC : p4, h2 = n8.nice, g2 = void 0 === h2 ? on.nice : h2, x3 = X({ format: o5, precision: c10, useUTC: y5 });
  r7 = "auto" === f2 ? x3(t9.min) : "native" !== o5 ? x3(f2) : f2, i7 = "auto" === v3 ? x3(t9.max) : "native" !== o5 ? x3(v3) : v3;
  var k4 = y5 ? utcTime() : time();
  k4.range([0, e11]), r7 && i7 && k4.domain([r7, i7]), true === g2 ? k4.nice() : "object" != typeof g2 && "number" != typeof g2 || k4.nice(g2);
  var T3 = k4;
  return T3.type = "time", T3.useUTC = y5, T3;
};
var cn2 = { type: "log", base: 10, min: "auto", max: "auto", round: false, reverse: false, nice: true };
var sn2 = function(n8, t9, e11, r7) {
  var i7, a6 = n8.base, o5 = void 0 === a6 ? cn2.base : a6, u5 = n8.min, c10 = void 0 === u5 ? cn2.min : u5, s6 = n8.max, d5 = void 0 === s6 ? cn2.max : s6, m3 = n8.round, l5 = void 0 === m3 ? cn2.round : m3, v3 = n8.reverse, p4 = void 0 === v3 ? cn2.reverse : v3, y5 = n8.nice, h2 = void 0 === y5 ? cn2.nice : y5;
  if (t9.all.some((function(n9) {
    return 0 === n9;
  }))) throw new Error("a log scale domain must not include or cross zero");
  var g2, x3, k4 = false;
  if (t9.all.filter((function(n9) {
    return null != n9;
  })).forEach((function(n9) {
    k4 || (void 0 === i7 ? i7 = Math.sign(n9) : Math.sign(n9) !== i7 && (k4 = true));
  })), k4) throw new Error("a log scale domain must be strictly-positive or strictly-negative");
  g2 = "auto" === c10 ? t9.min : c10, x3 = "auto" === d5 ? t9.max : d5;
  var T3 = log().base(o5), b6 = "x" === r7 ? [0, e11] : [e11, 0];
  true === l5 ? T3.rangeRound(b6) : T3.range(b6), true === p4 ? T3.domain([x3, g2]) : T3.domain([g2, x3]), true === h2 ? T3.nice() : "number" == typeof h2 && T3.nice(h2);
  var M4 = T3;
  return M4.type = "log", M4;
};
var dn2 = { type: "symlog", constant: 1, min: "auto", max: "auto", round: false, reverse: false, nice: true };
var mn = function(n8, t9, e11, r7) {
  var i7, a6, o5 = n8.constant, u5 = void 0 === o5 ? dn2.constant : o5, c10 = n8.min, s6 = void 0 === c10 ? dn2.min : c10, d5 = n8.max, m3 = void 0 === d5 ? dn2.max : d5, f2 = n8.round, v3 = void 0 === f2 ? dn2.round : f2, p4 = n8.reverse, y5 = void 0 === p4 ? dn2.reverse : p4, h2 = n8.nice, g2 = void 0 === h2 ? dn2.nice : h2;
  i7 = "auto" === s6 ? t9.min : s6, a6 = "auto" === m3 ? t9.max : m3;
  var x3 = symlog().constant(u5), k4 = "x" === r7 ? [0, e11] : [e11, 0];
  true === v3 ? x3.rangeRound(k4) : x3.range(k4), true === y5 ? x3.domain([a6, i7]) : x3.domain([i7, a6]), true === g2 ? x3.nice() : "number" == typeof g2 && x3.nice(g2);
  var T3 = x3;
  return T3.type = "symlog", T3;
};
var fn2 = function(n8) {
  return "x" === n8 ? "y" : "x";
};
var ln = function(n8, t9) {
  return n8 === t9;
};
var vn = function(n8, t9) {
  return n8.getTime() === t9.getTime();
};
function pn2(n8, t9, e11, r7) {
  switch (n8.type) {
    case "linear":
      return Z(n8, t9, e11, r7);
    case "point":
      return nn(0, t9, e11);
    case "band":
      return rn(n8, t9, e11, r7);
    case "time":
      return un2(n8, t9, e11);
    case "log":
      return sn2(n8, t9, e11, r7);
    case "symlog":
      return mn(n8, t9, e11, r7);
    default:
      throw new Error("invalid scale spec");
  }
}
var yn2 = function(n8, t9, e11) {
  var r7;
  if ("stacked" in e11 && e11.stacked) {
    var i7 = n8.data["x" === t9 ? "xStacked" : "yStacked"];
    return null == i7 ? null : e11(i7);
  }
  return null != (r7 = e11(n8.data[t9])) ? r7 : null;
};
var hn2 = function(n8, t9, e11, r7, i7) {
  var a6 = n8.map((function(n9) {
    return (function(n10) {
      return J({}, n10, { data: n10.data.map((function(n11) {
        return { data: J({}, n11) };
      })) });
    })(n9);
  })), o5 = gn2(a6, t9, e11);
  "stacked" in t9 && true === t9.stacked && Tn(o5, a6), "stacked" in e11 && true === e11.stacked && bn2(o5, a6);
  var u5 = pn2(t9, o5.x, r7, "x"), c10 = pn2(e11, o5.y, i7, "y"), s6 = a6.map((function(n9) {
    return J({}, n9, { data: n9.data.map((function(n10) {
      return J({}, n10, { position: { x: yn2(n10, "x", u5), y: yn2(n10, "y", c10) } });
    })) });
  }));
  return J({}, o5, { series: s6, xScale: u5, yScale: c10 });
};
var gn2 = function(n8, t9, e11) {
  return { x: xn2(n8, "x", t9), y: xn2(n8, "y", e11) };
};
var xn2 = function(i7, a6, o5, u5) {
  var c10 = void 0 === u5 ? {} : u5, s6 = c10.getValue, d5 = void 0 === s6 ? function(n8) {
    return n8.data[a6];
  } : s6, m3 = c10.setValue, f2 = void 0 === m3 ? function(n8, t9) {
    n8.data[a6] = t9;
  } : m3;
  if ("linear" === o5.type) i7.forEach((function(n8) {
    n8.data.forEach((function(n9) {
      var t9 = d5(n9);
      t9 && f2(n9, parseFloat(String(t9)));
    }));
  }));
  else if ("time" === o5.type && "native" !== o5.format) {
    var l5 = X(o5);
    i7.forEach((function(n8) {
      n8.data.forEach((function(n9) {
        var t9 = d5(n9);
        t9 && f2(n9, l5(t9));
      }));
    }));
  }
  var v3 = [];
  switch (i7.forEach((function(n8) {
    n8.data.forEach((function(n9) {
      v3.push(d5(n9));
    }));
  })), o5.type) {
    case "linear":
      var p4 = (0, import_sortBy.default)((0, import_uniq.default)(v3).filter((function(n8) {
        return null !== n8;
      })), (function(n8) {
        return n8;
      }));
      return { all: p4, min: Math.min.apply(Math, p4), max: Math.max.apply(Math, p4) };
    case "time":
      var y5 = (0, import_uniqBy.default)(v3, (function(n8) {
        return n8.getTime();
      })).slice(0).sort((function(n8, t9) {
        return t9.getTime() - n8.getTime();
      })).reverse();
      return { all: y5, min: y5[0], max: (0, import_last2.default)(y5) };
    default:
      var h2 = (0, import_uniq.default)(v3);
      return { all: h2, min: h2[0], max: (0, import_last2.default)(h2) };
  }
};
var kn2 = function(n8, t9, e11) {
  var a6 = fn2(n8), o5 = [];
  t9[a6].all.forEach((function(t10) {
    var u5 = (0, import_isDate.default)(t10) ? vn : ln, c10 = [];
    e11.forEach((function(e12) {
      var i7 = e12.data.find((function(n9) {
        return u5(n9.data[a6], t10);
      })), s6 = null, d5 = null;
      if (void 0 !== i7) {
        if (null !== (s6 = i7.data[n8])) {
          var m3 = (0, import_last2.default)(c10);
          void 0 === m3 ? d5 = s6 : null !== m3 && (d5 = m3 + s6);
        }
        i7.data["x" === n8 ? "xStacked" : "yStacked"] = d5;
      }
      c10.push(d5), null !== d5 && o5.push(d5);
    }));
  })), t9[n8].minStacked = Math.min.apply(Math, o5), t9[n8].maxStacked = Math.max.apply(Math, o5);
};
var Tn = function(n8, t9) {
  return kn2("x", n8, t9);
};
var bn2 = function(n8, t9) {
  return kn2("y", n8, t9);
};
var Mn2 = function(n8) {
  var t9 = n8.bandwidth();
  if (0 === t9) return n8;
  var e11 = t9 / 2;
  return n8.round() && (e11 = Math.round(e11)), function(t10) {
    var r7;
    return (null != (r7 = n8(t10)) ? r7 : 0) + e11;
  };
};
var wn2 = { millisecond: [millisecond_default, millisecond_default], second: [second_default, second_default], minute: [minute_default, utcMinute_default], hour: [hour_default, utcHour_default], day: [newInterval((function(n8) {
  return n8.setHours(0, 0, 0, 0);
}), (function(n8, t9) {
  return n8.setDate(n8.getDate() + t9);
}), (function(n8, t9) {
  return (t9.getTime() - n8.getTime()) / 864e5;
}), (function(n8) {
  return Math.floor(n8.getTime() / 864e5);
})), newInterval((function(n8) {
  return n8.setUTCHours(0, 0, 0, 0);
}), (function(n8, t9) {
  return n8.setUTCDate(n8.getUTCDate() + t9);
}), (function(n8, t9) {
  return (t9.getTime() - n8.getTime()) / 864e5;
}), (function(n8) {
  return Math.floor(n8.getTime() / 864e5);
}))], week: [sunday, utcSunday2], sunday: [sunday, utcSunday2], monday: [monday, utcMonday2], tuesday: [tuesday, utcTuesday2], wednesday: [wednesday, utcWednesday2], thursday: [thursday, utcThursday2], friday: [friday, utcFriday2], saturday: [saturday, utcSaturday2], month: [month_default, utcMonth_default], year: [year_default, utcYear_default] };
var En = Object.keys(wn2);
var Sn = new RegExp("^every\\s*(\\d+)?\\s*(" + En.join("|") + ")s?$", "i");
var Cn = function(n8, t9) {
  if (Array.isArray(t9)) return t9;
  if ("string" == typeof t9 && "useUTC" in n8) {
    var e11 = t9.match(Sn);
    if (e11) {
      var r7 = e11[1], i7 = e11[2], a6 = wn2[i7][n8.useUTC ? 1 : 0];
      if ("day" === i7) {
        var o5, u5, c10 = n8.domain(), s6 = c10[0], d5 = c10[1], m3 = new Date(d5);
        return m3.setDate(m3.getDate() + 1), null != (o5 = null == (u5 = a6.every(Number(null != r7 ? r7 : 1))) ? void 0 : u5.range(s6, m3)) ? o5 : [];
      }
      if (void 0 === r7) return n8.ticks(a6);
      var f2 = a6.every(Number(r7));
      if (f2) return n8.ticks(f2);
    }
    throw new Error("Invalid tickValues: " + t9);
  }
  if ("ticks" in n8) {
    if (void 0 === t9) return n8.ticks();
    if ("number" == typeof (l5 = t9) && isFinite(l5) && Math.floor(l5) === l5) return n8.ticks(t9);
  }
  var l5;
  return n8.domain();
};

// node_modules/@nivo/axes/dist/nivo-axes.mjs
var t7 = __toESM(require_react(), 1);
var import_react20 = __toESM(require_react(), 1);
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
function A3() {
  return A3 = Object.assign ? Object.assign.bind() : function(t9) {
    for (var e11 = 1; e11 < arguments.length; e11++) {
      var i7 = arguments[e11];
      for (var n8 in i7) ({}).hasOwnProperty.call(i7, n8) && (t9[n8] = i7[n8]);
    }
    return t9;
  }, A3.apply(null, arguments);
}
var T2 = function(t9) {
  var e11, i7 = t9.axis, n8 = t9.scale, r7 = t9.ticksPosition, o5 = t9.tickValues, l5 = t9.tickSize, c10 = t9.tickPadding, s6 = t9.tickRotation, f2 = t9.truncateTickAt, d5 = t9.engine, u5 = void 0 === d5 ? "svg" : d5, x3 = Cn(n8, o5), m3 = gt[u5], y5 = "bandwidth" in n8 ? Mn2(n8) : n8, g2 = { lineX: 0, lineY: 0 }, v3 = { textX: 0, textY: 0 }, k4 = "object" == typeof document && "rtl" === document.dir, b6 = m3.align.center, P4 = m3.baseline.center;
  "x" === i7 ? (e11 = function(t10) {
    var e12;
    return { x: null != (e12 = y5(t10)) ? e12 : 0, y: 0 };
  }, g2.lineY = l5 * ("after" === r7 ? 1 : -1), v3.textY = (l5 + c10) * ("after" === r7 ? 1 : -1), P4 = "after" === r7 ? m3.baseline.top : m3.baseline.bottom, 0 === s6 ? b6 = m3.align.center : "after" === r7 && s6 < 0 || "before" === r7 && s6 > 0 ? (b6 = m3.align[k4 ? "left" : "right"], P4 = m3.baseline.center) : ("after" === r7 && s6 > 0 || "before" === r7 && s6 < 0) && (b6 = m3.align[k4 ? "right" : "left"], P4 = m3.baseline.center)) : (e11 = function(t10) {
    var e12;
    return { x: 0, y: null != (e12 = y5(t10)) ? e12 : 0 };
  }, g2.lineX = l5 * ("after" === r7 ? 1 : -1), v3.textX = (l5 + c10) * ("after" === r7 ? 1 : -1), b6 = "after" === r7 ? m3.align.left : m3.align.right);
  return { ticks: x3.map((function(t10) {
    var i8 = "string" == typeof t10 ? (function(t11) {
      var e12 = String(t11).length;
      return f2 && f2 > 0 && e12 > f2 ? "" + String(t11).slice(0, f2).concat("...") : "" + t11;
    })(t10) : t10;
    return A3({ key: t10 instanceof Date ? "" + t10.valueOf() : "" + t10, value: i8 }, e11(t10), g2, v3);
  })), textAlign: b6, textBaseline: P4 };
};
var w3 = function(t9, e11) {
  if (void 0 === t9 || "function" == typeof t9) return t9;
  if ("time" === e11.type) {
    var i7 = timeFormat(t9);
    return function(t10) {
      return i7(t10 instanceof Date ? t10 : new Date(t10));
    };
  }
  return format(t9);
};
var O3 = function(t9) {
  var e11, i7 = t9.width, n8 = t9.height, r7 = t9.scale, a6 = t9.axis, o5 = t9.values, l5 = (e11 = o5, Array.isArray(e11) ? o5 : void 0) || Cn(r7, o5), c10 = "bandwidth" in r7 ? Mn2(r7) : r7, s6 = "x" === a6 ? l5.map((function(t10) {
    var e12, i8;
    return { key: t10 instanceof Date ? "" + t10.valueOf() : "" + t10, x1: null != (e12 = c10(t10)) ? e12 : 0, x2: null != (i8 = c10(t10)) ? i8 : 0, y1: 0, y2: n8 };
  })) : l5.map((function(t10) {
    var e12, n9;
    return { key: t10 instanceof Date ? "" + t10.valueOf() : "" + t10, x1: 0, x2: i7, y1: null != (e12 = c10(t10)) ? e12 : 0, y2: null != (n9 = c10(t10)) ? n9 : 0 };
  }));
  return s6;
};
var X2 = (0, import_react20.memo)((function(t9) {
  var e11, n8 = t9.value, r7 = t9.format, a6 = t9.lineX, o5 = t9.lineY, l5 = t9.onClick, c10 = t9.textBaseline, s6 = t9.textAnchor, f2 = t9.theme, u5 = t9.animatedProps, x3 = null != (e11 = null == r7 ? void 0 : r7(n8)) ? e11 : n8, y5 = (0, import_react20.useMemo)((function() {
    var t10 = { opacity: u5.opacity };
    return l5 ? { style: A3({}, t10, { cursor: "pointer" }), onClick: function(t11) {
      return l5(t11, x3);
    } } : { style: t10 };
  }), [u5.opacity, l5, x3]);
  return (0, import_jsx_runtime5.jsxs)(animated.g, A3({ transform: u5.transform }, y5, { children: [(0, import_jsx_runtime5.jsx)("line", { x1: 0, x2: a6, y1: 0, y2: o5, style: f2.line }), (0, import_jsx_runtime5.jsx)(b3, { dominantBaseline: c10, textAnchor: s6, transform: u5.textTransform, style: f2.text, children: "" + x3 })] }));
}));
var Y2 = { tickSize: 5, tickPadding: 5, tickRotation: 0, legendPosition: "middle", legendOffset: 0 };
var B2 = function(e11) {
  var r7 = e11.axis, a6 = e11.scale, l5 = e11.x, f2 = void 0 === l5 ? 0 : l5, u5 = e11.y, x3 = void 0 === u5 ? 0 : u5, v3 = e11.length, k4 = e11.ticksPosition, h2 = e11.tickValues, p4 = e11.tickSize, O5 = void 0 === p4 ? Y2.tickSize : p4, B4 = e11.tickPadding, z6 = void 0 === B4 ? Y2.tickPadding : B4, R4 = e11.tickRotation, V3 = void 0 === R4 ? Y2.tickRotation : R4, C6 = e11.format, D3 = e11.renderTick, j5 = void 0 === D3 ? X2 : D3, E5 = e11.truncateTickAt, W5 = e11.legend, q2 = e11.legendPosition, H2 = void 0 === q2 ? Y2.legendPosition : q2, I = e11.legendOffset, F2 = void 0 === I ? Y2.legendOffset : I, G = e11.style, J2 = e11.onClick, K2 = e11.ariaHidden, L4 = M(), M4 = w(L4.axis, G), N2 = (0, import_react20.useMemo)((function() {
    return w3(C6, a6);
  }), [C6, a6]), Q2 = T2({ axis: r7, scale: a6, ticksPosition: k4, tickValues: h2, tickSize: O5, tickPadding: z6, tickRotation: V3, truncateTickAt: E5 }), U = Q2.ticks, Z2 = Q2.textAlign, $ = Q2.textBaseline, _3 = null;
  if (void 0 !== W5) {
    var tt2, et = 0, it2 = 0, nt = 0;
    "y" === r7 ? (nt = -90, et = F2, "start" === H2 ? (tt2 = "start", it2 = v3) : "middle" === H2 ? (tt2 = "middle", it2 = v3 / 2) : "end" === H2 && (tt2 = "end")) : (it2 = F2, "start" === H2 ? tt2 = "start" : "middle" === H2 ? (tt2 = "middle", et = v3 / 2) : "end" === H2 && (tt2 = "end", et = v3)), _3 = (0, import_jsx_runtime5.jsx)(import_jsx_runtime5.Fragment, { children: (0, import_jsx_runtime5.jsx)(b3, { transform: "translate(" + et + ", " + it2 + ") rotate(" + nt + ")", textAnchor: tt2, style: A3({}, M4.legend.text, { dominantBaseline: "central" }), children: W5 }) });
  }
  var rt2 = Dr(), at2 = rt2.animate, ot2 = rt2.config, lt = useSpring({ transform: "translate(" + f2 + "," + x3 + ")", lineX2: "x" === r7 ? v3 : 0, lineY2: "x" === r7 ? 0 : v3, config: ot2, immediate: !at2 }), ct2 = (0, import_react20.useCallback)((function(t9) {
    return { opacity: 1, transform: "translate(" + t9.x + "," + t9.y + ")", textTransform: "translate(" + t9.textX + "," + t9.textY + ") rotate(" + V3 + ")" };
  }), [V3]), st = (0, import_react20.useCallback)((function(t9) {
    return { opacity: 0, transform: "translate(" + t9.x + "," + t9.y + ")", textTransform: "translate(" + t9.textX + "," + t9.textY + ") rotate(" + V3 + ")" };
  }), [V3]), ft2 = useTransition(U, { keys: function(t9) {
    return t9.key;
  }, initial: ct2, from: st, enter: ct2, update: ct2, leave: { opacity: 0 }, config: ot2, immediate: !at2 });
  return (0, import_jsx_runtime5.jsxs)(animated.g, { transform: lt.transform, "aria-hidden": K2, children: [ft2((function(e12, i7, n8, r8) {
    return t7.createElement(j5, A3({ tickIndex: r8, format: N2, rotate: V3, textBaseline: $, textAnchor: Z2, truncateTickAt: E5, animatedProps: e12, theme: M4.ticks }, i7, J2 ? { onClick: J2 } : {}));
  })), (0, import_jsx_runtime5.jsx)(animated.line, { style: M4.domain.line, x1: 0, x2: lt.lineX2, y1: 0, y2: lt.lineY2 }), _3] });
};
var z4 = (0, import_react20.memo)(B2);
var R3 = ["top", "right", "bottom", "left"];
var V2 = (0, import_react20.memo)((function(t9) {
  var e11 = t9.xScale, i7 = t9.yScale, n8 = t9.width, r7 = t9.height, a6 = { top: t9.top, right: t9.right, bottom: t9.bottom, left: t9.left };
  return (0, import_jsx_runtime5.jsx)(import_jsx_runtime5.Fragment, { children: R3.map((function(t10) {
    var o5 = a6[t10];
    if (!o5) return null;
    var l5 = "top" === t10 || "bottom" === t10;
    return (0, import_jsx_runtime5.jsx)(z4, A3({}, o5, { axis: l5 ? "x" : "y", x: "right" === t10 ? n8 : 0, y: "bottom" === t10 ? r7 : 0, scale: l5 ? e11 : i7, length: l5 ? n8 : r7, ticksPosition: "top" === t10 || "left" === t10 ? "before" : "after", truncateTickAt: o5.truncateTickAt }), t10);
  })) });
}));
var C4 = (0, import_react20.memo)((function(t9) {
  var e11 = t9.animatedProps, i7 = M();
  return (0, import_jsx_runtime5.jsx)(animated.line, A3({}, e11, i7.grid.line));
}));
var D2 = (0, import_react20.memo)((function(t9) {
  var e11 = t9.lines, i7 = Dr(), n8 = i7.animate, a6 = i7.config, l5 = useTransition(e11, { keys: function(t10) {
    return t10.key;
  }, initial: function(t10) {
    return { opacity: 1, x1: t10.x1, x2: t10.x2, y1: t10.y1, y2: t10.y2 };
  }, from: function(t10) {
    return { opacity: 0, x1: t10.x1, x2: t10.x2, y1: t10.y1, y2: t10.y2 };
  }, enter: function(t10) {
    return { opacity: 1, x1: t10.x1, x2: t10.x2, y1: t10.y1, y2: t10.y2 };
  }, update: function(t10) {
    return { opacity: 1, x1: t10.x1, x2: t10.x2, y1: t10.y1, y2: t10.y2 };
  }, leave: { opacity: 0 }, config: a6, immediate: !n8 });
  return (0, import_jsx_runtime5.jsx)("g", { children: l5((function(t10, e12) {
    return (0, import_react20.createElement)(C4, A3({}, e12, { key: e12.key, animatedProps: t10 }));
  })) });
}));
var j3 = (0, import_react20.memo)((function(t9) {
  var e11 = t9.width, n8 = t9.height, r7 = t9.xScale, a6 = t9.yScale, o5 = t9.xValues, l5 = t9.yValues, c10 = (0, import_react20.useMemo)((function() {
    return !!r7 && O3({ width: e11, height: n8, scale: r7, axis: "x", values: o5 });
  }), [r7, o5, e11, n8]), s6 = (0, import_react20.useMemo)((function() {
    return !!a6 && O3({ width: e11, height: n8, scale: a6, axis: "y", values: l5 });
  }), [n8, e11, a6, l5]);
  return (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [c10 && (0, import_jsx_runtime5.jsx)(D2, { lines: c10 }), s6 && (0, import_jsx_runtime5.jsx)(D2, { lines: s6 })] });
}));
var E3 = function(t9, e11) {
  var i7, n8, r7 = e11.axis, a6 = e11.scale, o5 = e11.x, c10 = void 0 === o5 ? 0 : o5, s6 = e11.y, d5 = void 0 === s6 ? 0 : s6, m3 = e11.length, y5 = e11.ticksPosition, g2 = e11.tickValues, v3 = e11.tickSize, k4 = void 0 === v3 ? Y2.tickSize : v3, h2 = e11.tickPadding, p4 = void 0 === h2 ? Y2.tickPadding : h2, b6 = e11.tickRotation, P4 = void 0 === b6 ? Y2.tickRotation : b6, S4 = e11.format, A5 = e11.legend, w4 = e11.legendPosition, O5 = void 0 === w4 ? Y2.legendPosition : w4, X3 = e11.legendOffset, B4 = void 0 === X3 ? Y2.legendOffset : X3, z6 = e11.theme, R4 = e11.style, V3 = T2({ axis: r7, scale: a6, ticksPosition: y5, tickValues: g2, tickSize: k4, tickPadding: p4, tickRotation: P4, engine: "canvas" }), C6 = V3.ticks, D3 = V3.textAlign, j5 = V3.textBaseline;
  t9.save(), t9.translate(c10, d5);
  var E5 = R(z6.axis, R4);
  t9.textAlign = D3, t9.textBaseline = j5, a4(t9, E5.ticks.text);
  var W5 = null != (i7 = E5.domain.line.strokeWidth) ? i7 : 0;
  "string" != typeof W5 && W5 > 0 && (t9.lineWidth = W5, t9.lineCap = "square", E5.domain.line.stroke && (t9.strokeStyle = E5.domain.line.stroke), t9.beginPath(), t9.moveTo(0, 0), t9.lineTo("x" === r7 ? m3 : 0, "x" === r7 ? 0 : m3), t9.stroke());
  var q2 = "function" == typeof S4 ? S4 : function(t10) {
    return "" + t10;
  }, H2 = null != (n8 = E5.ticks.line.strokeWidth) ? n8 : 0, I = "string" != typeof H2 && H2 > 0;
  if (C6.forEach((function(e12) {
    I && (t9.lineWidth = H2, t9.lineCap = "square", E5.ticks.line.stroke && (t9.strokeStyle = E5.ticks.line.stroke), t9.beginPath(), t9.moveTo(e12.x, e12.y), t9.lineTo(e12.x + e12.lineX, e12.y + e12.lineY), t9.stroke());
    var i8 = q2(e12.value);
    t9.save(), t9.translate(e12.x + e12.textX, e12.y + e12.textY), t9.rotate(ut(P4)), d3(t9, E5.ticks.text, "" + i8), t9.fillText("" + i8, 0, 0), t9.restore();
  })), void 0 !== A5) {
    var F2 = 0, G = 0, J2 = 0, K2 = "center";
    "y" === r7 ? (J2 = -90, F2 = B4, "start" === O5 ? (K2 = "start", G = m3) : "middle" === O5 ? (K2 = "center", G = m3 / 2) : "end" === O5 && (K2 = "end")) : (G = B4, "start" === O5 ? K2 = "start" : "middle" === O5 ? (K2 = "center", F2 = m3 / 2) : "end" === O5 && (K2 = "end", F2 = m3)), t9.translate(F2, G), t9.rotate(ut(J2)), a4(t9, E5.legend.text), E5.legend.text.fill && (t9.fillStyle = E5.legend.text.fill), t9.textAlign = K2, t9.textBaseline = "middle", d3(t9, E5.legend.text, A5);
  }
  t9.restore();
};
var W4 = function(t9, e11) {
  var i7 = e11.xScale, n8 = e11.yScale, r7 = e11.width, a6 = e11.height, o5 = e11.top, l5 = e11.right, c10 = e11.bottom, s6 = e11.left, f2 = e11.theme, d5 = { top: o5, right: l5, bottom: c10, left: s6 };
  R3.forEach((function(e12) {
    var o6 = d5[e12];
    if (!o6) return null;
    var l6 = "top" === e12 || "bottom" === e12, c11 = "top" === e12 || "left" === e12 ? "before" : "after", s7 = l6 ? i7 : n8, u5 = w3(o6.format, s7);
    E3(t9, A3({}, o6, { axis: l6 ? "x" : "y", x: "right" === e12 ? r7 : 0, y: "bottom" === e12 ? a6 : 0, scale: s7, format: u5, length: l6 ? r7 : a6, ticksPosition: c11, theme: f2 }));
  }));
};
var q = function(t9, e11) {
  var i7 = e11.width, n8 = e11.height, r7 = e11.scale, a6 = e11.axis, o5 = e11.values;
  O3({ width: i7, height: n8, scale: r7, axis: a6, values: o5 }).forEach((function(e12) {
    t9.beginPath(), t9.moveTo(e12.x1, e12.y1), t9.lineTo(e12.x2, e12.y2), t9.stroke();
  }));
};

// node_modules/@nivo/colors/dist/nivo-colors.mjs
var import_react21 = __toESM(require_react(), 1);
var import_get3 = __toESM(require_get(), 1);
var import_isPlainObject2 = __toESM(require_isPlainObject(), 1);
function Se(e11, r7) {
  (null == r7 || r7 > e11.length) && (r7 = e11.length);
  for (var n8 = 0, t9 = Array(r7); n8 < r7; n8++) t9[n8] = e11[n8];
  return t9;
}
function qe(e11, r7) {
  var n8 = "undefined" != typeof Symbol && e11[Symbol.iterator] || e11["@@iterator"];
  if (n8) return (n8 = n8.call(e11)).next.bind(n8);
  if (Array.isArray(e11) || (n8 = (function(e12, r8) {
    if (e12) {
      if ("string" == typeof e12) return Se(e12, r8);
      var n9 = {}.toString.call(e12).slice(8, -1);
      return "Object" === n9 && e12.constructor && (n9 = e12.constructor.name), "Map" === n9 || "Set" === n9 ? Array.from(e12) : "Arguments" === n9 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n9) ? Se(e12, r8) : void 0;
    }
  })(e11)) || r7 && e11 && "number" == typeof e11.length) {
    n8 && (e11 = n8);
    var t9 = 0;
    return function() {
      return t9 >= e11.length ? { done: true } : { done: false, value: e11[t9++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Ce() {
  return Ce = Object.assign ? Object.assign.bind() : function(e11) {
    for (var r7 = 1; r7 < arguments.length; r7++) {
      var n8 = arguments[r7];
      for (var t9 in n8) ({}).hasOwnProperty.call(n8, t9) && (e11[t9] = n8[t9]);
    }
    return e11;
  }, Ce.apply(null, arguments);
}
var Ge = { nivo: ["#e8c1a0", "#f47560", "#f1e15b", "#e8a838", "#61cdbb", "#97e3d5"], category10: category10_default, accent: Accent_default, dark2: Dark2_default, paired: Paired_default, pastel1: Pastel1_default, pastel2: Pastel2_default, set1: Set1_default, set2: Set2_default, set3: Set3_default, tableau10: Tableau10_default };
var Ve = Object.keys(Ge);
var Pe = { brown_blueGreen: scheme, purpleRed_green: scheme2, pink_yellowGreen: scheme3, purple_orange: scheme4, red_blue: scheme5, red_grey: scheme6, red_yellow_blue: scheme7, red_yellow_green: scheme8, spectral: scheme9 };
var Re = Object.keys(Pe);
var Ue = { brown_blueGreen: BrBG_default, purpleRed_green: PRGn_default, pink_yellowGreen: PiYG_default, purple_orange: PuOr_default, red_blue: RdBu_default, red_grey: RdGy_default, red_yellow_blue: RdYlBu_default, red_yellow_green: RdYlGn_default, spectral: Spectral_default };
var De = { blues: scheme22, greens: scheme23, greys: scheme24, oranges: scheme27, purples: scheme25, reds: scheme26, blue_green: scheme10, blue_purple: scheme11, green_blue: scheme12, orange_red: scheme13, purple_blue_green: scheme14, purple_blue: scheme15, purple_red: scheme16, red_purple: scheme17, yellow_green_blue: scheme18, yellow_green: scheme19, yellow_orange_brown: scheme20, yellow_orange_red: scheme21 };
var Me = Object.keys(De);
var Te = { blues: Blues_default, greens: Greens_default, greys: Greys_default, oranges: Oranges_default, purples: Purples_default, reds: Reds_default, turbo: turbo_default, viridis: viridis_default, inferno, magma, plasma, cividis: cividis_default, warm, cool, cubehelixDefault: cubehelix_default2, blue_green: BuGn_default, blue_purple: BuPu_default, green_blue: GnBu_default, orange_red: OrRd_default, purple_blue_green: PuBuGn_default, purple_blue: PuBu_default, purple_red: PuRd_default, red_purple: RdPu_default, yellow_green_blue: YlGnBu_default, yellow_green: YlGn_default, yellow_orange_brown: YlOrBr_default, yellow_orange_red: YlOrRd_default };
var $e = Ce({}, Ge, Pe, De);
var Be = Object.keys($e);
var Fe = function(e11) {
  return Ve.includes(e11);
};
var He = function(e11) {
  return Re.includes(e11);
};
var Je = function(e11) {
  return Me.includes(e11);
};
var Ke = { rainbow: rainbow_default, sinebow: sinebow_default };
var Le = Ce({}, Ue, Te, Ke);
var Ne = Object.keys(Le);
var Qe = function(e11) {
  return void 0 !== e11.theme;
};
var We = function(e11) {
  return void 0 !== e11.from;
};
var Xe = function(e11, r7) {
  if ("function" == typeof e11) return e11;
  if ((0, import_isPlainObject2.default)(e11)) {
    if (Qe(e11)) {
      if (void 0 === r7) throw new Error("Unable to use color from theme as no theme was provided");
      var n8 = (0, import_get3.default)(r7, e11.theme);
      if (void 0 === n8) throw new Error("Color from theme is undefined at path: '" + e11.theme + "'");
      return function() {
        return n8;
      };
    }
    if (We(e11)) {
      var t9 = function(r8) {
        return (0, import_get3.default)(r8, e11.from);
      };
      if (Array.isArray(e11.modifiers)) {
        for (var o5, i7 = [], u5 = function() {
          var e12 = o5.value, r8 = e12[0], n9 = e12[1];
          if ("brighter" === r8) i7.push((function(e13) {
            return e13.brighter(n9);
          }));
          else if ("darker" === r8) i7.push((function(e13) {
            return e13.darker(n9);
          }));
          else {
            if ("opacity" !== r8) throw new Error("Invalid color modifier: '" + r8 + "', must be one of: 'brighter', 'darker', 'opacity'");
            i7.push((function(e13) {
              return e13.opacity = n9, e13;
            }));
          }
        }, l5 = qe(e11.modifiers); !(o5 = l5()).done; ) u5();
        return 0 === i7.length ? t9 : function(e12) {
          return i7.reduce((function(e13, r8) {
            return r8(e13);
          }), rgb2(t9(e12))).toString();
        };
      }
      return t9;
    }
    throw new Error("Invalid color spec, you should either specify 'theme' or 'from' when using a config object");
  }
  return function() {
    return e11;
  };
};
var Ye = function(e11, r7) {
  return (0, import_react21.useMemo)((function() {
    return Xe(e11, r7);
  }), [e11, r7]);
};
var gr = function(e11, r7) {
  if ("function" == typeof e11) return e11;
  var n8 = "function" == typeof r7 ? r7 : function(e12) {
    return (0, import_get3.default)(e12, r7);
  };
  if (Array.isArray(e11)) {
    var t9 = ordinal(e11), o5 = function(e12) {
      return t9(n8(e12));
    };
    return o5.scale = t9, o5;
  }
  if ((0, import_isPlainObject2.default)(e11)) {
    if ((function(e12) {
      return void 0 !== e12.datum;
    })(e11)) return function(r8) {
      return (0, import_get3.default)(r8, e11.datum);
    };
    if ((function(e12) {
      return void 0 !== e12.scheme;
    })(e11)) {
      if (Fe(e11.scheme)) {
        var i7 = ordinal($e[e11.scheme]), u5 = function(e12) {
          return i7(n8(e12));
        };
        return u5.scale = i7, u5;
      }
      if (He(e11.scheme)) {
        if (void 0 !== e11.size && (e11.size < 3 || e11.size > 11)) throw new Error("Invalid size '" + e11.size + "' for diverging color scheme '" + e11.scheme + "', must be between 3~11");
        var l5 = ordinal($e[e11.scheme][e11.size || 11]), a6 = function(e12) {
          return l5(n8(e12));
        };
        return a6.scale = l5, a6;
      }
      if (Je(e11.scheme)) {
        if (void 0 !== e11.size && (e11.size < 3 || e11.size > 9)) throw new Error("Invalid size '" + e11.size + "' for sequential color scheme '" + e11.scheme + "', must be between 3~9");
        var c10 = ordinal($e[e11.scheme][e11.size || 9]), s6 = function(e12) {
          return c10(n8(e12));
        };
        return s6.scale = c10, s6;
      }
    }
    throw new Error("Invalid colors, when using an object, you should either pass a 'datum' or a 'scheme' property");
  }
  return function() {
    return e11;
  };
};
var hr = function(e11, r7) {
  return (0, import_react21.useMemo)((function() {
    return gr(e11, r7);
  }), [e11, r7]);
};

// node_modules/@nivo/legends/dist/nivo-legends.mjs
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var l4 = __toESM(require_react(), 1);
var import_react22 = __toESM(require_react(), 1);
var v2 = function(e11) {
  var i7 = e11.x, n8 = e11.y, o5 = e11.size, r7 = e11.fill, l5 = e11.opacity, a6 = void 0 === l5 ? 1 : l5, c10 = e11.borderWidth, s6 = void 0 === c10 ? 0 : c10, d5 = e11.borderColor;
  return (0, import_jsx_runtime6.jsx)("circle", { r: o5 / 2, cx: i7 + o5 / 2, cy: n8 + o5 / 2, fill: r7, opacity: a6, strokeWidth: s6, stroke: void 0 === d5 ? "transparent" : d5, style: { pointerEvents: "none" } });
};
var u4 = function(e11) {
  var i7 = e11.x, n8 = e11.y, o5 = e11.size, r7 = e11.fill, l5 = e11.opacity, a6 = void 0 === l5 ? 1 : l5, c10 = e11.borderWidth, s6 = void 0 === c10 ? 0 : c10, d5 = e11.borderColor;
  return (0, import_jsx_runtime6.jsx)("g", { transform: "translate(" + i7 + "," + n8 + ")", children: (0, import_jsx_runtime6.jsx)("path", { d: "\n                    M" + o5 / 2 + " 0\n                    L" + 0.8 * o5 + " " + o5 / 2 + "\n                    L" + o5 / 2 + " " + o5 + "\n                    L" + 0.2 * o5 + " " + o5 / 2 + "\n                    L" + o5 / 2 + " 0\n                ", fill: r7, opacity: a6, strokeWidth: s6, stroke: void 0 === d5 ? "transparent" : d5, style: { pointerEvents: "none" } }) });
};
var p3 = function(e11) {
  var i7 = e11.x, n8 = e11.y, o5 = e11.size, r7 = e11.fill, l5 = e11.opacity, a6 = void 0 === l5 ? 1 : l5, c10 = e11.borderWidth, s6 = void 0 === c10 ? 0 : c10, d5 = e11.borderColor;
  return (0, import_jsx_runtime6.jsx)("rect", { x: i7, y: n8, fill: r7, opacity: a6, strokeWidth: s6, stroke: void 0 === d5 ? "transparent" : d5, width: o5, height: o5, style: { pointerEvents: "none" } });
};
var y4 = function(e11) {
  var i7 = e11.x, n8 = e11.y, o5 = e11.size, r7 = e11.fill, l5 = e11.opacity, a6 = void 0 === l5 ? 1 : l5, c10 = e11.borderWidth, s6 = void 0 === c10 ? 0 : c10, d5 = e11.borderColor;
  return (0, import_jsx_runtime6.jsx)("g", { transform: "translate(" + i7 + "," + n8 + ")", children: (0, import_jsx_runtime6.jsx)("path", { d: "\n                M" + o5 / 2 + " 0\n                L" + o5 + " " + o5 + "\n                L0 " + o5 + "\n                L" + o5 / 2 + " 0\n            ", fill: r7, opacity: a6, strokeWidth: s6, stroke: void 0 === d5 ? "transparent" : d5, style: { pointerEvents: "none" } }) });
};
function b5() {
  return b5 = Object.assign ? Object.assign.bind() : function(t9) {
    for (var e11 = 1; e11 < arguments.length; e11++) {
      var i7 = arguments[e11];
      for (var n8 in i7) ({}).hasOwnProperty.call(i7, n8) && (t9[n8] = i7[n8]);
    }
    return t9;
  }, b5.apply(null, arguments);
}
var k3 = { translateX: 0, translateY: 0, padding: 0, itemsSpacing: 0, itemDirection: "left-to-right", justify: false, symbolShape: "square", symbolSize: 16, symbolSpacing: 8 };
var S3 = { top: 0, right: 0, bottom: 0, left: 0 };
var A4 = function(t9) {
  var e11, i7 = t9.direction, n8 = t9.itemsSpacing, o5 = t9.padding, r7 = t9.itemCount, l5 = t9.itemWidth, a6 = t9.itemHeight;
  if ("number" != typeof o5 && ("object" != typeof (e11 = o5) || Array.isArray(e11) || null === e11)) throw new Error("Invalid property padding, must be one of: number, object");
  var c10 = "number" == typeof o5 ? { top: o5, right: o5, bottom: o5, left: o5 } : b5({}, S3, o5), s6 = c10.left + c10.right, d5 = c10.top + c10.bottom, h2 = l5 + s6, g2 = a6 + d5, m3 = (r7 - 1) * n8;
  return "row" === i7 ? h2 = l5 * r7 + m3 + s6 : "column" === i7 && (g2 = a6 * r7 + m3 + d5), { width: h2, height: g2, padding: c10 };
};
var C5 = function(t9) {
  var e11 = t9.anchor, i7 = t9.translateX, n8 = t9.translateY, o5 = t9.containerWidth, r7 = t9.containerHeight, l5 = t9.width, a6 = t9.height, c10 = i7, s6 = n8;
  switch (e11) {
    case "top":
      c10 += (o5 - l5) / 2;
      break;
    case "top-right":
      c10 += o5 - l5;
      break;
    case "right":
      c10 += o5 - l5, s6 += (r7 - a6) / 2;
      break;
    case "bottom-right":
      c10 += o5 - l5, s6 += r7 - a6;
      break;
    case "bottom":
      c10 += (o5 - l5) / 2, s6 += r7 - a6;
      break;
    case "bottom-left":
      s6 += r7 - a6;
      break;
    case "left":
      s6 += (r7 - a6) / 2;
      break;
    case "center":
      c10 += (o5 - l5) / 2, s6 += (r7 - a6) / 2;
  }
  return { x: c10, y: s6 };
};
var z5 = function(t9) {
  var e11, i7, n8, o5, r7, l5, a6 = t9.direction, c10 = t9.justify, s6 = t9.symbolSize, d5 = t9.symbolSpacing, h2 = t9.width, g2 = t9.height;
  switch (a6) {
    case "left-to-right":
      e11 = 0, i7 = (g2 - s6) / 2, o5 = g2 / 2, l5 = "central", c10 ? (n8 = h2, r7 = "end") : (n8 = s6 + d5, r7 = "start");
      break;
    case "right-to-left":
      e11 = h2 - s6, i7 = (g2 - s6) / 2, o5 = g2 / 2, l5 = "central", c10 ? (n8 = 0, r7 = "start") : (n8 = h2 - s6 - d5, r7 = "end");
      break;
    case "top-to-bottom":
      e11 = (h2 - s6) / 2, i7 = 0, n8 = h2 / 2, r7 = "middle", c10 ? (o5 = g2, l5 = "alphabetic") : (o5 = s6 + d5, l5 = "text-before-edge");
      break;
    case "bottom-to-top":
      e11 = (h2 - s6) / 2, i7 = g2 - s6, n8 = h2 / 2, r7 = "middle", c10 ? (o5 = 0, l5 = "text-before-edge") : (o5 = g2 - s6 - d5, l5 = "alphabetic");
  }
  return { symbolX: e11, symbolY: i7, labelX: n8, labelY: o5, labelAnchor: r7, labelAlignment: l5 };
};
var O4 = { circle: v2, diamond: u4, square: p3, triangle: y4 };
var B3 = function(i7) {
  var n8, o5, r7, a6, d5, m3, f2, v3, u5, p4, y5, x3 = i7.x, S4 = i7.y, A5 = i7.width, C6 = i7.height, W5 = i7.data, w4 = i7.direction, X3 = void 0 === w4 ? k3.itemDirection : w4, Y3 = i7.justify, B4 = void 0 === Y3 ? k3.justify : Y3, H2 = i7.textColor, E5 = i7.background, j5 = void 0 === E5 ? "transparent" : E5, L4 = i7.opacity, M4 = void 0 === L4 ? 1 : L4, P4 = i7.symbolShape, F2 = void 0 === P4 ? k3.symbolShape : P4, T3 = i7.symbolSize, V3 = void 0 === T3 ? k3.symbolSize : T3, D3 = i7.symbolSpacing, R4 = void 0 === D3 ? k3.symbolSpacing : D3, q2 = i7.symbolBorderWidth, G = void 0 === q2 ? 0 : q2, I = i7.symbolBorderColor, _3 = void 0 === I ? "transparent" : I, J2 = i7.onClick, K2 = i7.onMouseEnter, N2 = i7.onMouseLeave, Q2 = i7.toggleSerie, U = i7.effects, Z2 = (0, import_react22.useState)({}), $ = Z2[0], tt2 = Z2[1], et = M(), it2 = (0, import_react22.useCallback)((function(t9) {
    if (U) {
      var e11 = U.filter((function(t10) {
        return "hover" === t10.on;
      })).reduce((function(t10, e12) {
        return b5({}, t10, e12.style);
      }), {});
      tt2(e11);
    }
    null == K2 || K2(W5, t9);
  }), [K2, W5, U]), nt = (0, import_react22.useCallback)((function(t9) {
    if (U) {
      var e11 = U.filter((function(t10) {
        return "hover" !== t10.on;
      })).reduce((function(t10, e12) {
        return b5({}, t10, e12.style);
      }), {});
      tt2(e11);
    }
    null == N2 || N2(W5, t9);
  }), [N2, W5, U]), ot2 = z5({ direction: X3, justify: B4, symbolSize: null != (n8 = $.symbolSize) ? n8 : V3, symbolSpacing: R4, width: A5, height: C6 }), rt2 = ot2.symbolX, lt = ot2.symbolY, at2 = ot2.labelX, ct2 = ot2.labelY, st = ot2.labelAnchor, dt2 = ot2.labelAlignment, ht2 = [J2, K2, N2, Q2].some((function(t9) {
    return void 0 !== t9;
  })), gt2 = "function" == typeof F2 ? F2 : O4[F2];
  return (0, import_jsx_runtime6.jsxs)("g", { transform: "translate(" + x3 + "," + S4 + ")", style: { opacity: null != (o5 = $.itemOpacity) ? o5 : M4 }, children: [(0, import_jsx_runtime6.jsx)("rect", { width: A5, height: C6, fill: null != (r7 = $.itemBackground) ? r7 : j5, style: { cursor: ht2 ? "pointer" : "auto" }, onClick: function(t9) {
    null == J2 || J2(W5, t9), null == Q2 || Q2(W5.id);
  }, onMouseEnter: it2, onMouseLeave: nt }), l4.createElement(gt2, b5({ id: W5.id, x: rt2, y: lt, size: null != (a6 = $.symbolSize) ? a6 : V3, fill: null != (d5 = null != (m3 = W5.fill) ? m3 : W5.color) ? d5 : "black", borderWidth: null != (f2 = $.symbolBorderWidth) ? f2 : G, borderColor: null != (v3 = $.symbolBorderColor) ? v3 : _3 }, W5.hidden ? et.legends.hidden.symbol : void 0)), (0, import_jsx_runtime6.jsx)(b3, { textAnchor: st, style: b5({}, et.legends.text, { fill: null != (u5 = null != (p4 = null != (y5 = $.itemTextColor) ? y5 : H2) ? p4 : et.legends.text.fill) ? u5 : "black", dominantBaseline: dt2, pointerEvents: "none", userSelect: "none" }, W5.hidden ? et.legends.hidden.text : void 0), x: at2, y: ct2, children: W5.label })] });
};
var H = function(e11) {
  var i7 = e11.data, n8 = e11.x, o5 = e11.y, r7 = e11.direction, l5 = e11.padding, a6 = void 0 === l5 ? k3.padding : l5, c10 = e11.justify, s6 = e11.effects, d5 = e11.itemWidth, h2 = e11.itemHeight, g2 = e11.itemDirection, m3 = void 0 === g2 ? k3.itemDirection : g2, f2 = e11.itemsSpacing, v3 = void 0 === f2 ? k3.itemsSpacing : f2, u5 = e11.itemTextColor, p4 = e11.itemBackground, y5 = void 0 === p4 ? "transparent" : p4, b6 = e11.itemOpacity, x3 = void 0 === b6 ? 1 : b6, S4 = e11.symbolShape, C6 = e11.symbolSize, z6 = e11.symbolSpacing, W5 = e11.symbolBorderWidth, w4 = e11.symbolBorderColor, X3 = e11.onClick, Y3 = e11.onMouseEnter, O5 = e11.onMouseLeave, H2 = e11.toggleSerie, E5 = A4({ itemCount: i7.length, itemWidth: d5, itemHeight: h2, itemsSpacing: v3, direction: r7, padding: a6 }).padding, j5 = "row" === r7 ? d5 + v3 : 0, L4 = "column" === r7 ? h2 + v3 : 0;
  return (0, import_jsx_runtime6.jsx)("g", { transform: "translate(" + n8 + "," + o5 + ")", children: i7.map((function(e12, i8) {
    return (0, import_jsx_runtime6.jsx)(B3, { data: e12, x: i8 * j5 + E5.left, y: i8 * L4 + E5.top, width: d5, height: h2, direction: m3, justify: c10, effects: s6, textColor: u5, background: y5, opacity: x3, symbolShape: S4, symbolSize: C6, symbolSpacing: z6, symbolBorderWidth: W5, symbolBorderColor: w4, onClick: X3, onMouseEnter: Y3, onMouseLeave: O5, toggleSerie: H2 }, i8);
  })) });
};
var E4 = function(e11) {
  var i7 = e11.data, n8 = e11.containerWidth, o5 = e11.containerHeight, r7 = e11.translateX, l5 = void 0 === r7 ? k3.translateX : r7, a6 = e11.translateY, c10 = void 0 === a6 ? k3.translateY : a6, s6 = e11.anchor, d5 = e11.direction, h2 = e11.padding, g2 = void 0 === h2 ? k3.padding : h2, m3 = e11.justify, f2 = e11.itemsSpacing, v3 = void 0 === f2 ? k3.itemsSpacing : f2, u5 = e11.itemWidth, p4 = e11.itemHeight, y5 = e11.itemDirection, b6 = e11.itemTextColor, x3 = e11.itemBackground, S4 = e11.itemOpacity, z6 = e11.symbolShape, W5 = e11.symbolSize, w4 = e11.symbolSpacing, X3 = e11.symbolBorderWidth, Y3 = e11.symbolBorderColor, O5 = e11.onClick, B4 = e11.onMouseEnter, E5 = e11.onMouseLeave, j5 = e11.toggleSerie, L4 = e11.effects, M4 = A4({ itemCount: i7.length, itemsSpacing: v3, itemWidth: u5, itemHeight: p4, direction: d5, padding: g2 }), P4 = M4.width, F2 = M4.height, T3 = C5({ anchor: s6, translateX: l5, translateY: c10, containerWidth: n8, containerHeight: o5, width: P4, height: F2 }), V3 = T3.x, D3 = T3.y;
  return (0, import_jsx_runtime6.jsx)(H, { data: i7, x: V3, y: D3, direction: d5, padding: g2, justify: m3, effects: L4, itemsSpacing: v3, itemWidth: u5, itemHeight: p4, itemDirection: y5, itemTextColor: b6, itemBackground: x3, itemOpacity: S4, symbolShape: z6, symbolSize: W5, symbolSpacing: w4, symbolBorderWidth: X3, symbolBorderColor: Y3, onClick: O5, onMouseEnter: B4, onMouseLeave: E5, toggleSerie: "boolean" == typeof j5 ? void 0 : j5 });
};
var j4 = { start: "left", middle: "center", end: "right" };
var L3 = function(t9, e11) {
  var i7 = e11.data, n8 = e11.containerWidth, o5 = e11.containerHeight, r7 = e11.translateX, l5 = void 0 === r7 ? 0 : r7, a6 = e11.translateY, c10 = void 0 === a6 ? 0 : a6, s6 = e11.anchor, d5 = e11.direction, h2 = e11.padding, g2 = void 0 === h2 ? 0 : h2, v3 = e11.justify, u5 = void 0 !== v3 && v3, p4 = e11.itemsSpacing, y5 = void 0 === p4 ? 0 : p4, k4 = e11.itemWidth, x3 = e11.itemHeight, S4 = e11.itemDirection, W5 = void 0 === S4 ? "left-to-right" : S4, w4 = e11.itemTextColor, X3 = e11.symbolSize, Y3 = void 0 === X3 ? 16 : X3, O5 = e11.symbolSpacing, B4 = void 0 === O5 ? 8 : O5, H2 = e11.theme, E5 = A4({ itemCount: i7.length, itemWidth: k4, itemHeight: x3, itemsSpacing: y5, direction: d5, padding: g2 }), L4 = E5.width, M4 = E5.height, P4 = E5.padding, F2 = C5({ anchor: s6, translateX: l5, translateY: c10, containerWidth: n8, containerHeight: o5, width: L4, height: M4 }), T3 = F2.x, V3 = F2.y, D3 = "row" === d5 ? k4 + y5 : 0, R4 = "column" === d5 ? x3 + y5 : 0;
  t9.save(), t9.translate(T3, V3), a4(t9, H2.legends.text), i7.forEach((function(e12, i8) {
    var n9, o6 = i8 * D3 + P4.left, r8 = i8 * R4 + P4.top, l6 = z5({ direction: W5, justify: u5, symbolSize: Y3, symbolSpacing: B4, width: k4, height: x3 }), a7 = l6.symbolX, c11 = l6.symbolY, s7 = l6.labelX, d6 = l6.labelY, h3 = l6.labelAnchor, g3 = l6.labelAlignment;
    t9.fillStyle = null != (n9 = e12.color) ? n9 : "black", t9.fillRect(o6 + a7, r8 + c11, Y3, Y3), t9.textAlign = j4[h3], "central" === g3 && (t9.textBaseline = "middle"), d3(t9, b5({}, H2.legends.text, { fill: null != w4 ? w4 : H2.legends.text.fill }), String(e12.label), o6 + s7, r8 + d6);
  })), t9.restore();
};

export {
  useSpring,
  useTransition,
  to2 as to,
  animated,
  require_Symbol,
  require_baseGetTag,
  require_isObject,
  require_Stack,
  require_cloneBuffer,
  require_cloneArrayBuffer,
  require_cloneTypedArray,
  require_copyArray,
  require_getPrototype,
  require_initCloneObject,
  require_isObjectLike,
  require_isArray,
  require_isBuffer,
  require_isPlainObject,
  require_baseUnary,
  require_nodeUtil,
  require_assignValue,
  require_copyObject,
  require_keysIn,
  require_arrayMap,
  require_toString,
  require_castPath,
  require_toKey,
  require_baseGet,
  require_jsx_runtime,
  M,
  w2 as w,
  T,
  E2 as E,
  V,
  z3 as z,
  line_default,
  area_default,
  stack_default,
  diverging_default,
  linear2 as linear,
  require_last,
  require_arrayPush,
  require_flatRest,
  require_baseGetAllKeys,
  require_arrayFilter,
  require_stubArray,
  require_getSymbols,
  require_keys,
  require_getAllKeys,
  require_getTag,
  Dr,
  Fr,
  $r,
  ut,
  ct,
  ft,
  ht,
  Rt,
  Ct,
  Pt,
  It,
  Et,
  un,
  cn,
  hn,
  pn,
  gn,
  bn,
  yn,
  wn,
  kn,
  Mn,
  Rn,
  a4 as a,
  d3 as d,
  b3 as b,
  require_baseIteratee,
  require_uniqBy,
  require_baseEach,
  pn2,
  hn2,
  Y2 as Y,
  V2,
  j3 as j,
  W4 as W,
  q,
  Ye,
  hr,
  E4 as E2,
  L3 as L
};
//# sourceMappingURL=chunk-24M753MT.js.map
