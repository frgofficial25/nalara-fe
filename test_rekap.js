const apiKey = 'GSV6K570cC05dhvWODt35y7Q5Pd4PCjfJHYEUHAJMSdEZH25Wk5YVqo8L08mFP3HUaEr1CEdn3yT1D5hxxdprDHb6mirNrS4FQu50Sd18UCGvwn6huS17zG1CBNxd2IoeBjizHqwRVXLaCqVIa04CLCXLnmZ21DwFd9BiuNLQ8PdhCQ47l4pzzLXye1qK3Bo';
const url = 'http://187.77.122.154:1000/api/quiz/rekap';

fetch(url, {
  headers: {
    'x-api-key': apiKey
  }
})
.then(res => res.json())
.then(data => console.log('RESPONSE:', JSON.stringify(data, null, 2)))
.catch(err => console.error('ERROR:', err));
