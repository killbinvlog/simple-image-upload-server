export default function log(title, message) {
	console.log(`[${new Date().toLocaleString()}] [${title}] ${message}`);
}
