import AudioVisualizer from "./AudioVisualizer"

const App = () => {
	return (
		<div className='App'>
			<h1>Welcome to React</h1>
			<AudioVisualizer url='https://s3-us-west-2.amazonaws.com/s.cdpn.io/3/shoptalk-clip.mp3' />
		</div>
	);
};

export default App;
