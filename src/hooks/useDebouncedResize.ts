import { useState, useEffect } from 'react';

export default function useDebouncedResize(debounceTime = 100) {
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            }, debounceTime);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, [debounceTime]);

    return dimensions;
}