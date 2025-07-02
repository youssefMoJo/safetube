import React, { useState, useEffect } from "react";
import styled from "styled-components";
import LottieAnimation from "./LottieAnimation";

const CountdownContainer = styled.section`
  background: linear-gradient(180deg, #0b1d2c 0%, #071621 100%);
  padding: 3rem 1.5rem;
  text-align: center;
  border-top: 2px solid #1cc7d1;
  border-bottom: 2px solid #1cc7d1;
  box-shadow: 0 0 10px rgba(28, 199, 209, 0.3);
`;

const TimeBlock = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const TimeSegment = styled.div`
  background-color: #071621;
  border: 1px solid #1cc7d1;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  min-width: 80px;
  text-align: center;
  box-shadow: inset 0 0 6px rgba(28, 199, 209, 0.4);
`;

const TimeNumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #ff8c42;
  margin-bottom: 0.25rem;
`;

const TimeLabel = styled.div`
  font-size: 0.9rem;
  color: #e0f7fa;
`;

const MainLabel = styled.p`
  font-size: 1.1rem;
  color: #e0f7fa;
  margin-top: 1rem;
`;

const calculateTimeLeft = (targetDate) => {
  const difference = +new Date(targetDate) - +new Date();
  if (difference > 0) {
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  } else {
    return { expired: true };
  }
};

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <CountdownContainer>
        <TimeNumber>We're Live!</TimeNumber>
        <MainLabel>Thanks for your interest in SafeTube ❤️</MainLabel>
      </CountdownContainer>
    );
  }

  return (
    <CountdownContainer>
      <TimeBlock>
        <TimeSegment>
          <TimeNumber>{timeLeft.days}</TimeNumber>
          <TimeLabel>Days</TimeLabel>
        </TimeSegment>
        <TimeSegment>
          <TimeNumber>{timeLeft.hours}</TimeNumber>
          <TimeLabel>Hours</TimeLabel>
        </TimeSegment>
        <TimeSegment>
          <TimeNumber>{timeLeft.minutes}</TimeNumber>
          <TimeLabel>Minutes</TimeLabel>
        </TimeSegment>
        <TimeSegment>
          <TimeNumber>{timeLeft.seconds}</TimeNumber>
          <TimeLabel>Seconds</TimeLabel>
        </TimeSegment>
      </TimeBlock>
      <MainLabel>until launch</MainLabel>
      <LottieAnimation />
    </CountdownContainer>
  );
};

export default CountdownTimer;
