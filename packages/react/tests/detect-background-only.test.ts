import { describe, expect, it } from '@rstest/core';
import { analyzeBackgroundOnlyUsage, runSkill } from '../src/index';

describe('detect-background-only', () => {
  describe('should report errors for lynx.getJSModule', () => {
    it('should detect lynx.getJSModule in render scope', () => {
      const source = `
export function App() {
  const module = lynx.getJSModule('SomeModule');
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].ruleId).toBe('detect-background-only');
      expect(diagnostics[0].message).toContain('lynx.getJSModule');
    });

    it('should detect lynx.getJSModule call in render scope', () => {
      const source = `
export function App() {
  lynx.getJSModule('SomeModule').doSomething();
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      expect(diagnostics[0].message).toContain('lynx.getJSModule');
    });
  });

  describe('should report errors for NativeModules', () => {
    it('should detect NativeModules in render scope', () => {
      const source = `
export function App() {
  NativeModules.SomeModule.call();
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      expect(diagnostics[0].message).toContain('NativeModules');
    });

    it('should detect NativeModules property access in render scope', () => {
      const source = `
export function App() {
  const value = NativeModules.SomeModule.someProperty;
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      expect(diagnostics[0].message).toContain('NativeModules');
    });
  });

  describe('should allow in useEffect', () => {
    it('should allow lynx.getJSModule inside useEffect', () => {
      const source = `
export function App() {
  useEffect(() => {
    lynx.getJSModule('SomeModule').doSomething();
  }, []);
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });

    it('should allow NativeModules inside useEffect', () => {
      const source = `
export function App() {
  useEffect(() => {
    NativeModules.SomeModule.call();
  }, []);
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });

    it('should allow inside useLayoutEffect', () => {
      const source = `
export function App() {
  useLayoutEffect(() => {
    lynx.getJSModule('SomeModule');
    NativeModules.SomeModule.call();
  }, []);
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('should allow in background only functions', () => {
    it('should allow lynx.getJSModule inside background only function', () => {
      const source = `
export function App() {
  function doBackgroundWork() {
    'background only';
    lynx.getJSModule('SomeModule').doSomething();
  }

  useEffect(() => {
    doBackgroundWork();
  }, []);

  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });

    it('should allow NativeModules inside background only function', () => {
      const source = `
export function App() {
  const doBackgroundWork = () => {
    'background only';
    NativeModules.SomeModule.call();
  };

  useEffect(() => {
    doBackgroundWork();
  }, []);

  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });

    it('should allow with double-quoted directive', () => {
      const source = `
export function App() {
  function doBackgroundWork() {
    "background only";
    lynx.getJSModule('SomeModule');
  }

  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('should allow in event handlers', () => {
    it('should allow in bindtap handler function', () => {
      const source = `
export function App() {
  function handleTap() {
    lynx.getJSModule('SomeModule').doSomething();
  }

  return <view bindtap={handleTap} />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });

    it('should allow in catchtap handler function', () => {
      const source = `
export function App() {
  function handleTap() {
    lynx.getJSModule('SomeModule');
  }

  return <view catchtap={handleTap} />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });

    it('should allow in inline event handler', () => {
      const source = `
export function App() {
  return <view bindtap={() => {
    lynx.getJSModule('SomeModule');
  }} />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('should allow in ref callbacks', () => {
    it('should allow in inline ref callback', () => {
      const source = `
export function App() {
  return <text ref={(ref) => {
    lynx.getJSModule('SomeModule');
  }} />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });

    it('should allow NativeModules in ref callback', () => {
      const source = `
export function App() {
  return <view ref={(ref) => {
    NativeModules.SomeModule.call();
  }} />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('should allow in useImperativeHandle', () => {
    it('should allow lynx.getJSModule inside useImperativeHandle', () => {
      const source = `
export function App() {
  useImperativeHandle(ref, () => ({
    doSomething: () => lynx.getJSModule('SomeModule')
  }));
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });

    it('should allow NativeModules inside useImperativeHandle', () => {
      const source = `
export function App() {
  useImperativeHandle(ref, () => {
    NativeModules.SomeModule.call();
    return {};
  });
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('should not report for non-background APIs', () => {
    it('should not report regular function calls', () => {
      const source = `
export function App() {
  console.log('hello');
  someFunction();
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });

    it('should not report other member expressions', () => {
      const source = `
export function App() {
  const value = someObject.someProperty;
  Math.random();
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('runSkill alias', () => {
    it('should work the same as analyzeBackgroundOnlyUsage', () => {
      const source = `
export function App() {
  lynx.getJSModule('SomeModule');
  return <view />;
}
`;
      const diagnostics1 = analyzeBackgroundOnlyUsage(source);
      const diagnostics2 = runSkill(source);
      expect(diagnostics1).toEqual(diagnostics2);
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed valid and invalid usage', () => {
      const source = `
export function App() {
  lynx.getJSModule('Module1');

  function handleTap() {
    lynx.getJSModule('Module2');
  }

  useEffect(() => {
    NativeModules.SomeModule.call();
  }, []);

  function doBackgroundWork() {
    'background only';
    NativeModules.AnotherModule.call();
  }

  return <view bindtap={handleTap} />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].message).toContain('lynx.getJSModule');
    });

    it('should detect multiple violations', () => {
      const source = `
export function App() {
  lynx.getJSModule('Module1');
  NativeModules.SomeModule.call();
  return <view />;
}
`;
      const diagnostics = analyzeBackgroundOnlyUsage(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(2);
    });
  });
});
