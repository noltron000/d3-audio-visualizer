class AudioVisualizer {
	constructor (audioURL) {
		// Get HTML elements.
		this.audioElement = document.getElementById('main-audio')
		this.visualElement = document.getElementById('main-visual')

		// Load & initialize audio file to "Audio" object.
		// https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement/Audio
		this.audio = this.audioElement // new Audio(audioURL)

		// Create an "AudioContext" and setup the analyzer.
		// https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
		this.audioContext = new AudioContext()
		this.audioAnalyzer = this.audioContext.createAnalyser()
		this.audioAnalyzer.fftSize = 2048

		// TODO: understand what this does a little better
		// connect source audio with the analyzer
		const source = this.audioContext.createMediaElementSource(this.audio)
		source.connect(this.audioAnalyzer)
		this.audioAnalyzer.connect(this.audioContext.destination)

		// The bundled track has only faint, infrequent activity above 15.4 kHz.
		// Each FFT bin spans sampleRate / fftSize Hz; a shorter array omits higher bins.
		const maxFrequencyHz = 15400
		const frequencyBinCount = Math.min(
			this.audioAnalyzer.frequencyBinCount,
			Math.floor(maxFrequencyHz * this.audioAnalyzer.fftSize / this.audioContext.sampleRate) + 1
		)
		this.frequencyArray = new Uint8Array(frequencyBinCount)

		// Start the first frame by calling the .setup() method.
		this.setup()
		window.addEventListener('resize', () => this.resize())
	}

	_getDataColor (index, frequency) {
		return d3
		.scaleLinear()
		.domain([100, 200])
		.range(["#2c7bb6","#d7191c"]) // this is a function!
		(frequency) // immediately call it with an index.
	}

	_getDataAlpha (index, frequency) {
		const number = Math.min(100, frequency / 255)
		return `${number*100}%`
	}

	_getPositionX (index, frequency) {
		const radius = this._getPropertyR(index, frequency)
		const position = index * this.props.width / (this.frequencyArray.length - 1)
		// Keep the full circle within the viewport, including at the edges.
		return Math.max(radius, Math.min(this.props.width - radius, position))
	}

	_getPositionY (index, frequency) {
		const radius = this._getPropertyR(index, frequency)
		// Scale vertical movement down for short viewports.
		const position = this.props.height / 2 - frequency * Math.min(1, this.props.height / 512)
		return Math.max(radius, Math.min(this.props.height - radius, position))
	}

	_getPropertyR (index, frequency) {
		const basic = this.props.width / this.frequencyArray.length / 2 + 0.3
		const enlarge = basic * frequency / 10 - 5
		return Math.min(Math.max(basic, enlarge), this.props.width / 2, this.props.height / 2)
	}

	resize () {
		// Measure the SVG so its dimensions and circle positions follow the viewport.
		const bounds = this.visualElement.getBoundingClientRect()
		this.props = {
			'width': bounds.width,
			'height': bounds.height,
		}
		this.svg
		.attr('width', this.props.width)
		.attr('height', this.props.height)
	}

	setup () {
		// populate the frequency array
		this.audioAnalyzer.getByteFrequencyData(this.frequencyArray)

		// set up the svg object
		this.svg = d3
		// .select('main-visual')
		.select(this.visualElement)
		this.resize()

		// create the frequency circles
		this.svg
		.selectAll('circle') // ???
		.data(this.frequencyArray)
		.enter()
		.append('circle')
		.attr('optimizeQuality', 'optimizeSpeed')
		.attr('r', (frequency, index) => this._getPropertyR(index, frequency))
		.attr('cx', (frequency, index) => this._getPositionX(index, frequency))
		.attr('cy', (frequency, index) => this._getPositionY(index, frequency))
		.attr('fill', (frequency, index) => this._getDataColor(index, frequency))
		.attr('fill-opacity', (frequency, index) => this._getDataAlpha(index, frequency))

		// call render on the next frame
		requestAnimationFrame(() => {
			this.render()
		})
	}

	render () {
		// populate the frequencyArray
		this.audioAnalyzer.getByteFrequencyData(this.frequencyArray)

		// select svg items
		this.svg
		.selectAll('circle')
		.data(this.frequencyArray)
		.attr('cx', (frequency, index) => this._getPositionX(index, frequency))
		.attr('cy', (frequency, index) => this._getPositionY(index, frequency))
		.attr('fill', (frequency, index) => this._getDataColor(index, frequency))
		.attr('r', (frequency, index) => this._getPropertyR(index, frequency))
		.attr('fill-opacity', (frequency, index) => this._getDataAlpha(index, frequency))

		// repeat render function every frame
		requestAnimationFrame(() => {
			this.render()
		})
	}
}

const RickRoll = () => {
	return new AudioVisualizer('./data/rick-roll.mp3')
}
