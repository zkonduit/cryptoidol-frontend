import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { mdiPlay } from '@mdi/js';

const RED_COLOR = `#FF214D`;
const GREEN_COLOR = `#359008`;

const outerCircleVariantsStart = {
  circle: {
    transform: 'scale(1.3)',
    opacity: 0.5,
    boxShadow: `0px 0px 0px 10px ${RED_COLOR}`,
  },
  largeCircle: {
    transform: 'scale(1.1)',
    opacity: 1,
    boxShadow: `0px 0px 0px 10px ${RED_COLOR}`,
  },
  pulseIn: {
    transform: 'scale(1.3)',
    opacity: 1,
    boxShadow: `0px 0px 0px 20px ${RED_COLOR}`,
  },
  pulseOut: {
    transform: 'scale(1.1)',
    opacity: 1,
    boxShadow: `0px 0px 0px 10px ${RED_COLOR}`,
  },
};

const innerCircleVariantsStart = {
  circle: {
    transform: 'scale(0.8)',
    borderRadius: '100%',
    opacity: 1.0
  },
  circleSmall: {
    transform: 'scale(0.6)',
    opacity: 1.0
  }
};

const outerCircleVariantsInProgress = {
  circle: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
    boxShadow: `0px 0px 0px 10px ${RED_COLOR}`,
  },
  largeCircle: {
    width: '120%',
    height: '120%',
    opacity: 1,
    boxShadow: `0px 0px 0px 10px ${RED_COLOR}`,
  },
  pulseIn: {
    width: '110%',
    height: '110%',
    opacity: 0.5,
    boxShadow: `0px 0px 0px 20px ${RED_COLOR}`,
  },
  pulseOut: {
    width: '120%',
    height: '120%',
    opacity: 0.1,
    boxShadow: `0px 0px 0px 10px ${RED_COLOR}`,
  },
};

const innerCircleVariantsInProgress = {
  square: {
    transform: 'scale(0.5)',
    borderRadius: '15%',
    opacity: 1.0
  },
  pulseIn: {
    transform: 'scale(0.4)',
    opacity: 1.0,
    boxShadow: `0px 0px 0px 20px ${RED_COLOR}`,
  },
  pulseOut: {
    transform: 'scale(0.7)',
    opacity: 0.5,
    boxShadow: `0px 0px 0px 10px ${RED_COLOR}`,
  }
};


const innerCircleVariantsEnd = {
  circle: {
    fill: GREEN_COLOR,
    rotate: '0deg'
  },
  pulseIn: {
    fill: GREEN_COLOR,
    rotate: '-10deg',
  }
}

const outerCircleVariantsEnd = {
  circle: {
    transform: 'scale(1.1)',
    opacity: 0.5,
    boxShadow: `0px 0px 0px 10px ${GREEN_COLOR}`,
  },
  pulseIn: {
    transform: 'scale(0)',
    opacity: 0,
    boxShadow: `0px 0px 0px 20px ${GREEN_COLOR}`,
  },
};


export const RecordButton = ({ recordState = "start", ...props }) => {
  const [hover, setHover] = useState(false);
  const innerCircleAnimation = useAnimation();
  const outerCircleAnimation = useAnimation();

  useEffect(() => {
    (async () => {
      if (recordState === "start") {
        if (hover) {
          outerCircleAnimation.start('largeCircle');
          innerCircleAnimation.start('circleSmall');
        } else {
          outerCircleAnimation.start('circle');
          innerCircleAnimation.start('circle');
        }
      }

      if (recordState === "inprogress") {
        if (hover) {
          await outerCircleAnimation.start('largeCircle');
          await outerCircleAnimation.start('square');
        } else {
          await innerCircleAnimation.start(['square', 'largeCircle']);
          innerCircleAnimation.start(['pulseOut', 'pulseIn'], {
            repeat: Infinity,
            repeatType: 'mirror',
          });
          outerCircleAnimation.start(['pulseOut', 'pulseIn'], {
            repeat: Infinity,
            repeatType: 'mirror',
          });
        }
      }

      if (recordState === "end") {
        await outerCircleAnimation.stop();
        await innerCircleAnimation.stop();
        if (hover) {
          outerCircleAnimation.start('pulseIn');
          innerCircleAnimation.start('pulseIn');
        } else {
          outerCircleAnimation.start('circle');
          innerCircleAnimation.start('circle');
        }
      }
    })();
  }, [hover, recordState]);

  if (recordState === "start") {
    return (
      <motion.div
        style={styles.container}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={props.onClick}
      >
        <motion.div
          initial="circle"
          animate={outerCircleAnimation}
          variants={outerCircleVariantsStart}
          style={{ ...styles.circle, ...styles.outerCircle }}
        />
        <motion.div
          initial="circle"
          animate={innerCircleAnimation}
          variants={innerCircleVariantsStart}
          style={{ ...styles.circle, ...styles.innerCircle }}
        />
      </motion.div>
    );
  }
  if (recordState === "inprogress") {
    return (
      <motion.div
        style={styles.container}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={props.onClick}
      >
        <motion.div
          initial="circle"
          animate={outerCircleAnimation}
          variants={outerCircleVariantsInProgress}
          style={{ ...styles.circle, ...styles.outerCircle }}
        />
        <motion.div
          initial="square"
          animate={innerCircleAnimation}
          variants={innerCircleVariantsInProgress}
          style={{ ...styles.circle, ...styles.innerCircle }}
        />
      </motion.div>
    );
  }

  if (recordState === "end") {
    return (
      <motion.div
        style={styles.container}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={props.onClick}
      >
        <motion.div
          initial="circle"
          animate={outerCircleAnimation}
          variants={outerCircleVariantsEnd}
          style={{ ...styles.circle, ...styles.outerCircle }}
        />
        {/* Pimp the path animation */}
        <motion.svg
          style={{
            marginLeft: "0.5rem",
          }}
          width="75"
          height="75"
          viewBox="0 0 75 75"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={innerCircleAnimation}
          variants={innerCircleVariantsEnd}
        >
          <motion.path
            d="M60 27.3397C66.6667 31.1887 66.6667 40.8113 60 44.6603L15 70.641C8.33333 74.49 -3.65772e-06 69.6788 -3.32122e-06 61.9808L-1.04991e-06 10.0192C-7.13424e-07 2.32124 8.33333 -2.49002 15 1.35898L60 27.3397Z"
            fill={GREEN_COLOR}
            shapeRendering="geometricPrecision"
          />
        </motion.svg>
      </motion.div>
    );

  }

};

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    margin: "0.8rem",
  },
  circle: {
    position: 'absolute',
  },
  outerCircle: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 9999,
  },
  innerCircle: {
    width: '90%',
    height: '90%',
    overflow: 'hidden',
    backgroundColor: RED_COLOR,
  },
};