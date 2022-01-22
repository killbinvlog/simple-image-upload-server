export default function parse_date(date = new Date()) {
	const year = date.getFullYear();
	let month = date.getMonth() + 1;
	if (month.toString().length == 1) month = '0' + month;
	let day = date.getDate();
	if (day.toString().length == 1) day = '0' + day;
	let hours = date.getHours();
	if (hours.toString().length == 1) hours = '0' + hours;
	let minutes = date.getMinutes();
	if (minutes.toString().length == 1) minutes = '0' + minutes;
	let seconds = date.getSeconds();
	if (seconds.toString().length == 1) seconds = '0' + seconds;
	const milliseconds = date.getMilliseconds();

	return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}