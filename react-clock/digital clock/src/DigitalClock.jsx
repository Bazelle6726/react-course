import React, { useState, useEffect } from 'react';

function DigitalClock() {

    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    function formatTime(date) {
        let hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const meridiem = date.getHours() >= 12 ? 'PM' : 'AM';

        hours = hours % 12 || 12; // Convert to 12-hour format

        return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)} ${meridiem}`;
    }

    function padZero(num) {
        return num.toString().padStart(2, '0');
    }

    return (
        <div className="clock-container">
            <div className="clock">
                <span>{formatTime(time)}</span>
            </div>
        </div>
    );
}

export default DigitalClock;