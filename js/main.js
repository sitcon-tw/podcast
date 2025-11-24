// Extracted from inline script in index.html
const RSS_FEED_URL = 'https://feeds.soundon.fm/podcasts/429de7c0-0c71-4fc9-a2a3-fcc3a651988e.xml';
const SPOTIFY_RSS_URL = 'https://fetchrss.com/feed/aSKjwDPSDZTyaSKjkF7Yp38C.rss';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function formatDate(dateString) {
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return '';
		}
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}/${month}/${day}`;
	} catch (error) {
		console.error('日期格式化錯誤:', error);
		return '';
	}
}

function formatDuration(duration) {
	if (!duration) return '';

	try {
		if (duration.includes(':')) {
			const parts = duration.split(':').map(p => parseInt(p));
			let totalMinutes = 0;

			if (parts.length === 3) {
				totalMinutes = parts[0] * 60 + parts[1];
			} else if (parts.length === 2) {
				totalMinutes = parts[0];
			}

			return totalMinutes > 0 ? `${totalMinutes}M` : '';
		}

		const seconds = parseInt(duration);
		if (!isNaN(seconds) && seconds > 0) {
			const minutes = Math.floor(seconds / 60);
			return `${minutes}M`;
		}

		return '';
	} catch (error) {
		console.error('時間格式化錯誤:', error);
		return '';
	}
}

function getTextContent(element, selector, defaultValue = '') {
	try {
		const el = element.querySelector(selector);
		return el?.textContent?.trim() || defaultValue;
	} catch (error) {
		return defaultValue;
	}
}

const PODCAST_PLATFORMS = {
	spotify: 'https://sitcon.org/podcast-sp',
	apple: 'https://sitcon.org/podcast-ap',
	youtube: 'https://sitcon.org/podcast-yt'
};

async function loadSpotifyLinks() {
	try {
		const response = await fetch(`${CORS_PROXY}${encodeURIComponent(SPOTIFY_RSS_URL)}`);

		if (!response.ok) {
			console.warn('無法載入 Spotify RSS');
			return {};
		}

		const text = await response.text();
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(text, 'text/xml');

		const items = xmlDoc.querySelectorAll('item');
		const spotifyMap = {};

		items.forEach((item) => {
			const title = getTextContent(item, 'title');
			const link = getTextContent(item, 'link');

			if (title && link) {
				const cleanTitle = title.trim().toLowerCase();
				spotifyMap[cleanTitle] = link;
			}
		});

		console.log(`成功載入 ${Object.keys(spotifyMap).length} 個 Spotify 連結`);
		return spotifyMap;

	} catch (error) {
		console.error('載入 Spotify RSS 失敗:', error);
		return {};
	}
}

function createPodcastElement(item, spotifyLinks) {
	const title = getTextContent(item, 'title');
	const pubDate = getTextContent(item, 'pubDate');
	const link = getTextContent(item, 'link', '#');

	let duration = getTextContent(item, 'itunes\\:duration') ||
		getTextContent(item, 'duration') ||
		item.querySelector('duration')?.textContent?.trim() || '';

	const formattedDate = formatDate(pubDate);
	const formattedDuration = formatDuration(duration);

	let dateTimeText = formattedDate;
	if (formattedDuration) {
		dateTimeText += `・${formattedDuration}`;
	}

	// 嘗試從 Spotify RSS 找到對應的連結
	const cleanTitle = title.trim().toLowerCase();
	const spotifyLink = spotifyLinks[cleanTitle] || PODCAST_PLATFORMS.spotify;

	const podcastDiv = document.createElement('div');
	podcastDiv.className = 'podcast';

	podcastDiv.innerHTML = `
        <p id='date'>${dateTimeText}</p>
        <p>${title}</p>
        <div class="podcastLink">
            <a href="${spotifyLink}" class="" target="_blank" rel="noopener noreferrer" title="Spotify">
                <img src="public/icons/spotify.svg" alt="Spotify">
            </a>
            <a href="${PODCAST_PLATFORMS.apple}" class="" target="_blank" rel="noopener noreferrer" title="Apple Podcast">
                <img src="public/icons/podcast.svg" alt="Apple Podcast">
            </a>
            <a href="${PODCAST_PLATFORMS.youtube}" class="" target="_blank" rel="noopener noreferrer" title="YouTube">
                <img src="public/icons/youtube.svg" alt="YouTube">
            </a>
            <a href="${link}" class="" target="_blank" rel="noopener noreferrer" title="SoundOn">
                <img src="public/icons/soundon.svg" alt="SoundOn">
            </a>
        </div>
    `;

	return podcastDiv;
}

async function loadPodcasts() {
	const podcastListDiv = document.getElementById('podcastList');

	try {
		podcastListDiv.innerHTML = '<div class="loading-spinner">載入中...</div>';

		const [spotifyLinks, response] = await Promise.all([
			loadSpotifyLinks(),
			fetch(`${CORS_PROXY}${encodeURIComponent(RSS_FEED_URL)}`)
		]);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const text = await response.text();

		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(text, 'text/xml');

		const parseError = xmlDoc.querySelector('parsererror');
		if (parseError) {
			throw new Error('XML 解析失敗');
		}

		const items = xmlDoc.querySelectorAll('item');

		podcastListDiv.innerHTML = '';

		if (items.length === 0) {
			podcastListDiv.innerHTML = '<p style="text-align: center; padding: 20px;">目前沒有 podcast 內容</p>';
			return;
		}

		items.forEach((item) => {
			try {
				const podcastElement = createPodcastElement(item, spotifyLinks);
				podcastListDiv.appendChild(podcastElement);
			} catch (error) {
				console.error('建立 podcast 元素時發生錯誤:', error);
			}
		});

		console.log(`成功載入 ${items.length} 個 podcast episodes`);

	} catch (error) {
		console.error('載入 podcast 失敗:', error);
		podcastListDiv.innerHTML = `
            <div class="error-message">
                <p>載入失敗，請稍後再試</p>
                <p style="font-size: 0.9em; margin-top: 10px;">錯誤訊息: ${error.message}</p>
                <button id="retryBtn" style="margin-top: 10px; padding: 8px 16px; cursor: pointer;">
                    重新載入
                </button>
            </div>
        `;

		document.getElementById('retryBtn')?.addEventListener('click', () => loadPodcasts());
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', loadPodcasts);
} else {
	loadPodcasts();
}

window.loadPodcasts = loadPodcasts;
