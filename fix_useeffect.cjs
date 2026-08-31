const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const target = `  useEffect(() => {
    if (currentUser) {
       fetchData();
    } else {
       setLoading(false);
    }
  }, [currentUser, activeClassId]);`;

const replacement = `  const prevClassIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentUser) {
       const isClassChange = prevClassIdRef.current !== null && prevClassIdRef.current !== activeClassId;
       prevClassIdRef.current = activeClassId;
       fetchData(isClassChange);
    } else {
       setLoading(false);
    }
  }, [currentUser, activeClassId]);`;

code = code.replace(target, replacement);
fs.writeFileSync('App.tsx', code);
