import { useEffect, useRef } from 'react';
import useFetch from './useFetch';

const audioContext = new window.AudioContext();

export interface AudioVisualizerProps {
	url: string;
	style?: React.CSSProperties;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
	url,
	style,
}) => {
	const [{ data: audioBuffer }] = useFetch<AudioBuffer>(url, undefined, {
		onSettled: async (res, dispatch) => {
			const arrayBuffer = await res.arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

			dispatch({ type: 'FETCH_SUCCESS', payload: audioBuffer });
		},
	});

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const canvas = canvasRef.current;

	useEffect(() => {
		if (canvas && audioBuffer)
			draw(canvas, normalizeData(filterData(audioBuffer)));
	}, [canvas, audioBuffer]);

	return <canvas style={style} ref={canvasRef}></canvas>;
};

export default AudioVisualizer;

const filterData = (audioBuffer: AudioBuffer) => {
	const rawData = audioBuffer.getChannelData(0);
	const samples = 70;
	let blockSize = Math.floor(rawData.length / samples);
	const filteredData: number[] = [];

	for (let i = 0; i < samples; ++i) {
		let blockStart = blockSize * i;
		let sum = 0;

		for (let j = 0; j < blockSize; ++j) {
			sum += Math.abs(rawData[blockStart + j]);
		}

		filteredData.push(sum / blockSize);
	}

	return filteredData;
};

const normalizeData = (filteredData: number[]) => {
	const multiplier = Math.pow(Math.max(...filteredData), -1);
	return filteredData.map(n => n * multiplier);
};

const draw = (canvas: HTMLCanvasElement, normalizedData: number[]) => {
	const dpr = window.devicePixelRatio || 1;
	const padding = 20;

	canvas.width = canvas.offsetWidth * dpr;
	canvas.height = (canvas.offsetHeight + padding * 2) * dpr;

	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('not able to get the canvas context');

	ctx.scale(dpr, dpr);
	ctx.translate(0, canvas.offsetHeight / 2 + padding);

	// draw line segments
	const width = canvas.offsetWidth / normalizedData.length;

	normalizedData.forEach((data, i) => {
		const x = width * i;
		let height = data * canvas.offsetHeight - padding;

		if (height < 0) height = 0;
		else if (height > canvas.offsetHeight / 2)
			height = canvas.offsetHeight / 2;

		drawLineSegment(ctx, x, height, width, (i + 1) % 2 == 0);
	});
};

const drawLineSegment = (
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	isEven: boolean
) => {
	ctx.lineWidth = 2;
	ctx.strokeStyle = 'pink';
	ctx.beginPath();
	y = isEven ? y : -y;
	ctx.moveTo(x, 0);
	ctx.lineTo(x, y);
	ctx.arc(x + width / 2, y, width / 2, Math.PI, 0, isEven);
	ctx.lineTo(x + width, 0);
	ctx.stroke();
};
