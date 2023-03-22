/**
 * Needed helpers
 * turn_approaching? - check if there's red or green showing above blue
 *.   - if yeas return the "intensity" of the turn and dir    
 * control speed as a function of distance to the turn
 * 
 * when turn is not approching base steering on the color distribution of the lowest row
 */ 

const checkRows = 5
let newLap = false

function checkNewLap(frame) {
	const lower10 = frame.slice(frame.length - 10)
	if (lower10.map(checkColorMask).some(b => b === true)) {
		newLap = true
		setTimeout(() => {
			newLap = false
		}, 2000)
	}
}

function keepLeft(frame) {
	const left = RED
	const firstRow = frame[0]
	const lastRow = frame[frame.length - 1]
	const sideThreshold = lastRow.length / 2
	const current = lastRow[sideThreshold];
	// cases
	const future = colorDistribution(frame.slice(0, 5))
	const steering = futureSteeringCoefficient(future, RED, current)	
	return abs(steering) < 0.3 ? 0.0 : steering
}

/**
* The brain of your bot. Makes decisions based on the incoming "frame" of pixels.
**/
function decide(frame) {
	const steering = keepLeft(frame)	
	const throttle = 0.6
	return { throttle, steering };
}

function calcThrottle(steering) {
	const steeringAbs = abs(steering)
	if (steeringAbs < 0.20) return 1.00
	if (steeringAbs > 0.85) return 0.08
	//if (steeringAbs > 0.75) return 0.14
	// if (steeringAbs > 0.70) return 0.15
	// if (steeringAbs > 0.60) return 0.35
//		return max(1.0 - Math.sqrt(steeringAbs), minThrottle)
	return max(min(1.0 - steeringAbs, 1.0), 0.10)
}

function calcSteering(steering) {
	const steeringAbs = abs(steering)
	//if (steeringAbs < 0.2) return 0.0
	if (steeringAbs > 0.8) return steering < 0 ? -1.0 : 1.0
	return steering
}

/**
* Pixel frame preprocessor. The example implementation simplifies each pixel
to either RED, GREEN, BLUE or BLACK. Your implementation may do something more
advanced, including changing the dimensions of this frame. The result always
needs to be a 2 dimensional array of RGB color objects though.
**/
function preprocess(frame) {
	const threshold = 30;
	// slice removes the landscapegi
	return frame.slice(frame.length / 3 + 1).map((row) =>
		row.map((pixel) => {
			if (pixel.r - Math.max(pixel.g, pixel.b) > threshold) return RED;
			if (pixel.g - Math.max(pixel.r, pixel.b) > threshold) return GREEN;
			if (pixel.b - Math.max(pixel.g, pixel.r) > threshold) return BLUE;
			return BLACK;
		})
	);
}

const RED = { r: 255, g: 0, b: 0 } 
const GREEN = { r: 0, g: 255, b: 0 } 
const BLUE = { r: 0, g: 0, b: 255 } 
const BLACK = { r: 0, g: 0, b: 0 } 

/**
 *  Helper function for comparing colors
 */
function sameColor(x, y) {
	return x.r === y.r && x.g === y.g && x.b === y.b;
}
/**
 * Helper functions that are "hoisted"
 * 
 */
function abs(num) {
	return num < 0 ? -num : num
}

function colorToSteering(color) {
	if (sameColor(color, RED)) return -1
	if (sameColor(color, GREEN)) return 1
	return 0
}

function futureSteeringCoefficient([red, green, blue], stayOn, current) {
	if (red === 0 && green === 0) return 1
	let rightComponent = colorToSteering(RED) * red 
	let leftComponent = colorToSteering(GREEN) * green
	let divider = red + green

	if(sameColor(stayOn, RED) 
		&& !sameColor(current, RED)) {
		leftComponent += colorToSteering(GREEN) * blue
		divider += blue
	}

	return (rightComponent + leftComponent) / divider
} 

function max(a, b) {
	return a > b ? a : b
}

function min(a, b) {
	return a > b ? b : a
}

function sum(ar) {
	return ar.reduce((sum, next) => (sum + next), 0)
}

function colorDistribution(pixels) {
	return pixels
		.flat()
		.reduce(([red, green, blue, black], nextPixel) => {
			if(sameColor(nextPixel, RED)) {
				return [red + 1, green, blue, black]
			}
			if (sameColor(nextPixel, GREEN)) {
				return [red, green + 1, blue, black]  
			}
			if (sameColor(nextPixel, BLUE)) {
				return [red, green, blue + 1, black]  
			}
			return [red, green, blue, black + 1]
		}, [0, 0, 0, 0])
}

function withoutBlackRows(frame) {
	return frame.filter(row => {
		const [red, green, blue, black] = colorDistribution(row)
		console.log(`color distribution ${colorDistribution(row)}`)
		return black < (red + green + blue)
	})
}

// try to guess new lap start if we meet this pattern somewhere in the lower rows 
const mask = [BLUE,BLACK,BLUE,BLACK,BLUE,BLACK,BLUE] 
function checkColorMask(row) {
	let maskIndex = 0
	for(x = 0; x < row.length; x++) {
		if (maskIndex === mask.length) return true
		if (sameColor(row[x], mask[maskIndex])) {
			for (; x < row.length && sameColor(row[x], mask[maskIndex]); x++)
			maskIndex++;
		} else {
			return false;
		}
	}
	return false
}

