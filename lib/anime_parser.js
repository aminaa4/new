import axios from 'axios';
import * as cheerio from 'cheerio';

import {
  generateEncryptAjaxParameters,
  decryptEncryptAjaxResponse,
} from './helpers/extractors/goload.js';
import { extractStreamSB } from './helpers/extractors/streamsb.js';
import { extractFembed } from './helpers/extractors/fembed.js';
import { USER_AGENT, renameKey } from './utils.js';

const BASE_URL = 'https://anime3rb.com';
const BASE_URL3 = 'https://anitaku.pe/home.html';
const BASE_URL2 = 'https://anitaku.pe/';
const ajax_url = 'https://ajax.gogocdn.net/';
const anime_info_url = 'https://gogoanime3.net/category/';
const anime_movies_path = '/anime-movies.html';
const popular_path = '/popular.html';
const new_season_path = '/new-season.html';
const search_path = '/search.html';
const popular_ongoing_url = `${ajax_url}ajax/page-recent-release-ongoing.html`;
const recent_release_url = `${ajax_url}ajax/page-recent-release.html`;
const list_episodes_url = `${ajax_url}ajax/load-list-episode`;
const seasons_url = 'https://anitaku.pe/sub-category/';

const Referer = 'https://gogoplay.io/';
const goload_stream_url = 'https://goload.pro/streaming.php';
export const DownloadReferer = 'https://goload.pro/';

const disqus_iframe = (episodeId) =>
  `https://disqus.com/embed/comments/?base=default&f=gogoanimetv&t_u=https%3A%2F%2Fgogoanime.vc%2F${episodeId}&s_o=default#version=cfefa856cbcd7efb87102e7242c9a829`;
const disqus_api = (threadId, page) =>
  `https://disqus.com/api/3.0/threads/listPostsThreaded?limit=100&thread=${threadId}&forum=gogoanimetv&order=popular&cursor=${page}:0:0&api_key=E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F`;

const Genres = [
  'action',
  'adventure',
  'cars',
  'comedy',
  'crime',
  'dementia',
  'demons',
  'drama',
  'dub',
  'ecchi',
  'family',
  'fantasy',
  'game',
  'gourmet',
  'harem',
  'hentai',
  'historical',
  'horror',
  'josei',
  'kids',
  'magic',
  'martial-arts',
  'mecha',
  'military',
  'Mmusic',
  'mystery',
  'parody',
  'police',
  'psychological',
  'romance',
  'samurai',
  'school',
  'sci-fi',
  'seinen',
  'shoujo',
  'shoujo-ai',
  'shounen',
  'shounen-ai',
  'slice-of-life',
  'space',
  'sports',
  'super-power',
  'supernatural',
  'suspense',
  'thriller',
  'vampire',
  'yaoi',
  'yuri',
  'isekai',
];

const cachedDownloadLinks = {};

export const scrapeSearch = async ({ list = [], keyw, page = 1 }) => {
  try {
    const searchPage = await axios.get(`https://anime3rb.com/search?q=${keyw}&page=${page}`);
    const $ = cheerio.load(searchPage.data);

    $('div:nth-of-type(2) > div:nth-of-type(4) > main > section > div > div > div:nth-of-type(3) > div:first-child > div > div > a:first-child').each((i, el) => {
      list.push({
        animeTitle: $(el).find('h2').text().replace(/"/g, ""),
        animeId: $(el).attr('href').replace("https://anime3rb.com/titles/", ""),
        imgUrl: $(el).find('img').attr('src')
      });
    });

    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeRecentRelease = async ({ list = [], page = 1 }) => {
  try {
    const mainPage = await axios.get(`https://anime3rb.com/?page=${page}`);
    const $ = cheerio.load(mainPage.data);

    $('#videos > div').each((i, el) => {
      list.push({
        episodeId: $(el).find('a').attr('href').replace('https://anime3rb.com/episode/',''),
        name: $(el).find('h3').text(),
        episodeNum: $(el).find('p').text(),
        imgUrl: $(el).find('img').attr('src'),
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};


// 3RB ANIME
export const scrapeAnimeList = async ({ list = [], page = 1 }) => {
  try {
    const AnimeList = await axios.get(`${BASE_URL}/titles/list?page=${page}`);
    const $ = cheerio.load(AnimeList.data);

    $('div:nth-of-type(2) > div:nth-of-type(4) > main > section > div > div > div:nth-of-type(3) > div:first-child > div > div > a:first-child').each((i, el) => {
      list.push({
        animeTitle: $(el).find('h2').text().replace(/"/g, ""),
        animeId: $(el).attr('href').replace("https://anime3rb.com/titles/", ""),
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeRecentlyAdded = async (list = []) => {
  try {
    const RecentlyAdded = await axios.get(`https://anime3rb.com/`);
    const $ = cheerio.load(RecentlyAdded.data);

    $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > section:nth-of-type(3) > div > div > div:nth-of-type(2) > ul > li > div > a:first-child').each((i, el) => {
      list.push({
        animeId: $(el).attr('href').replace('https://anime3rb.com/titles/',''),
        name: $(el).find('h2').text().replace(/"/g, ""),
        imgUrl: $(el).find('img').attr('src'),
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeGenre = async ({ list = [], genre, page = 1 }) => {
  try {
    genre = genre.trim().replace(/ /g, '-').toLowerCase();

    if (Genres.indexOf(genre) > -1) {
      const genrePage = await axios.get(`${BASE_URL}/genre/${genre}?page=${page}`);
      const $ = cheerio.load(genrePage.data);

      $('div:nth-of-type(2) > div:nth-of-type(4) > main > section > div > div > div:nth-of-type(3) > div:first-child > div > div').each((i, el) => {
      list.push({
        animeTitle: $(el).find('h2').text().replace(/"/g, ""),
        animeId: $(el).find('a:first-child').attr('href').replace("https://anime3rb.com/titles/", ""),
        imgUrl: $(el).find('a:first-child > img').attr('src'),
        released: $(el).find('a:nth-of-type(2) > div > p > span:nth-of-type(1)').text(),

      });
      });
      return list;
    }
    return { error: 'Genre Not Found' };
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

// 3RB ANIME
export const scrapeAnimeTv = async ({ list = [], page = 1 }) => {
  try {
    const AnimeList = await axios.get(`${BASE_URL}/titles/list?page=${page}`);
    const $ = cheerio.load(AnimeList.data);

    $('div:nth-of-type(2) > div:nth-of-type(4) > main > section > div > div > div:nth-of-type(3) > div:first-child > div > div > a:first-child').each((i, el) => {
      list.push({
        animeTitle: $(el).find('h2').text().replace(/"/g, ""),
        animeId: $(el).attr('href').replace("https://anime3rb.com/titles/", ""),
        imgUrl: $(el).find('img').attr('src')
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

// 3RB ANIME
export const scrapeAnimeOva = async ({ list = [], page = 1 }) => {
  try {
    const AnimeList = await axios.get(`${BASE_URL}/titles/list/ova?page=${page}`);
    const $ = cheerio.load(AnimeList.data);

    $('div:nth-of-type(2) > div:nth-of-type(4) > main > section > div > div > div:nth-of-type(3) > div:first-child > div > div > a:first-child').each((i, el) => {
      list.push({
        animeTitle: $(el).find('h2').text().replace(/"/g, ""),
        animeId: $(el).attr('href').replace("https://anime3rb.com/titles/", ""),
        imgUrl: $(el).find('img').attr('src')
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

// 3RB ANIME
export const scrapeAnimeOna = async ({ list = [], page = 1 }) => {
  try {
    const AnimeList = await axios.get(`${BASE_URL}/titles/list/ona?page=${page}`);
    const $ = cheerio.load(AnimeList.data);

    $('div:nth-of-type(2) > div:nth-of-type(4) > main > section > div > div > div:nth-of-type(3) > div:first-child > div > div > a:first-child').each((i, el) => {
      list.push({
        animeTitle: $(el).find('h2').text().replace(/"/g, ""),
        animeId: $(el).attr('href').replace("https://anime3rb.com/titles/", ""),
        imgUrl: $(el).find('img').attr('src')
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeAnimeMovies = async ({ list = [], aph = '', page = 1 }) => {
  try {
    const popularPage = await axios.get(`
        ${BASE_URL}/titles/list/movie?page=${page}
        `);
    const $ = cheerio.load(popularPage.data);

    $('div:nth-of-type(2) > div:nth-of-type(4) > main > section > div > div > div:nth-of-type(3) > div:first-child > div > div > a:first-child').each((i, el) => {
      list.push({
        animeTitle: $(el).find('h2').text().replace(/"/g, ""),
        animeId: $(el).attr('href').replace("https://anime3rb.com/titles/", ""),
        imgUrl: $(el).find('img').attr('src')
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

// 3RB ANIME
export const scrapeWatchAnime = async ({ id, episodeId }) => {
  try {
    let genres = [];
    let epList = [];


    const WatchAnime = await axios.get(`https://anime3rb.com/episode/${id}/${episodeId}`);

    const $ = cheerio.load(WatchAnime.data);

    const anime_category = $('#player-section > div > div > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > h1 > a').attr('href').replace('https://anime3rb.com/titles/', '');
    const titleText = $('#player-section > div > div > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > h1 > a').text().trim();
    const cleanedText = titleText.split('\n')[0].trim() + ' ' + titleText.split('\n')[1].trim();
    const download = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(4) > div:nth-of-type(2) > div:nth-of-type(1) > div > div:nth-of-type(3) > a').attr('href');

    // Select the section with id 'player-section'
    const playerSection = $('#player-section');

    // Initialize videoSourceUrl
    let videoSourceUrl = null; // Declare the variable to hold the video source URL

    // Get the x-data attribute
    const xData = playerSection.attr('x-data');

    if (xData) {
        // Extract videoSource from x-data using regex
        const videoSourceMatch = xData.match(/videoSource:\s*'([^']+)'/);
        if (videoSourceMatch && videoSourceMatch[1]) {
            videoSourceUrl = videoSourceMatch[1]
                .replace(/\\\//g, '/') // Replace escaped slashes
                .replace(/\\u0026/g, '&'); // Replace encoded ampersand
        }
    }

    // Assign episode_link based on whether videoSourceUrl was found
    const episode_link = videoSourceUrl ? videoSourceUrl : 'URL not found'; // Fallback if not found


    return {
      anime_info: anime_category,
      animeNameWithEP: cleanedText.toString(),
      video: episode_link,
      ep_download: download,
    };
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};



export const scrapeAnimeAZ = async ({ list = [], aph, page = 1 }) => {
  try {
    const AnimeAZ = await axios.get(`${BASE_URL}/anime-list-${aph}?page=${page}`);
    const $ = cheerio.load(AnimeAZ.data);

    $('div.anime_list_body > ul.listing > li').each((i, el) => {
      list.push({
        animeTitle: $(el).find('a').html().replace(/"/g, ""),
        animeId: $(el).find('a').attr('href').replace("/category/", ""),
        liTitle: $(el).attr('title')
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};



export const scrapeOngoingSeries = async ({list = [], page = 1}) => {
  try {
    const OngoingSeries = await axios.get(`${BASE_URL}/?page=${page}`);
    const $ = cheerio.load(OngoingSeries.data);

    $('nav.menu_series.cron ul li').each((i, el) => {
      list.push({
        animeId: $(el).find('a').attr('href'),
        animeName: $(el).find('a').text()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeNewSeason = async ({ list = [], page = 1 }) => {
  try {
    const popularPage = await axios.get(`
        ${BASE_URL + new_season_path}?page=${page}
        `);
    const $ = cheerio.load(popularPage.data);

    $('div.last_episodes > ul > li').each((i, el) => {
      list.push({
        animeId: $(el).find('p.name > a').attr('href').split('/')[2],
        animeTitle: $(el).find('p.name > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').text().trim()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeOngoingAnime = async ({ list = [], page = 1 }) => {
  try {
    const OngoingAnime = await axios.get(`${BASE_URL}/ongoing-anime.html?page=${page}`);
    const $ = cheerio.load(OngoingAnime.data);

    $('div.main_body div.last_episodes ul.items li').each((i, el) => {
      list.push({
        animeId: $(el).find('p.name > a').attr('href').split('/')[2],
        animeTitle: $(el).find('p.name > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').text().trim()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeCompletedAnime = async ({ list = [], page = 1 }) => {
  try {
    const CompletedAnime = await axios.get(`${BASE_URL}/completed-anime.html?page=${page}`);
    const $ = cheerio.load(CompletedAnime.data);

    $('div.main_body div.last_episodes ul.items li').each((i, el) => {
      list.push({
        animeId: $(el).find('p.name > a').attr('href').split('/')[2],
        animeTitle: $(el).find('p.name > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').text().trim()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapePopularAnime = async ({ list = [], page = 1 }) => {
  try {
    const popularPage = await axios.get(`
        ${BASE_URL + popular_path}?page=${page}
       `);
    const $ = cheerio.load(popularPage.data);

    $('div.last_episodes > ul > li').each((i, el) => {
      list.push({
        animeId: $(el).find('p.name > a').attr('href').split('/')[2],
        animeTitle: $(el).find('p.name > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').text().trim()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};



export const scrapeTopAiringAnime = async (list = []) => {
  try {
    const popularPage = await axios.get(`https://anime3rb.com/`);
    const $ = cheerio.load(popularPage.data);

    $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > section:nth-of-type(1) > div:nth-of-type(2) > div > div:nth-of-type(2) > ul > li').each((i, el) => {
      list.push({
        animeTitle: $(el).find('h3').text().replace(/"/g, ""),
        episodeId: $(el).find('a').attr('href').replace("https://anime3rb.com/episode/", ""),
        episodeTitle: $(el).find('p').text().replace(/"/g, ""),
        imgUrl: $(el).find('img').attr('src')

      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};



// scrapeGenre({ genre: "cars", page: 1 }).then((res) => console.log(res))

/**
 * @param {string} id anime id.
 * @returns Resolves when the scraping is complete.
 * @example
 * scrapeGoGoAnimeInfo({id: "naruto"})
 * .then((res) => console.log(res)) // => The anime information is returned in an Object.
 * .catch((err) => console.log(err))
 *
 */
export const scrapeAnimeDetails = async ({ id }) => {
  try {
    let genres = [];
    let epList = [];
    let videoSrcs = [];
    let animeRelated = []
    let alsoRelated = []

    const animePageTest = await axios.get(`https://anime3rb.com/titles/${id}`);

    const $ = cheerio.load(animePageTest.data);

    const animeTitle = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:first-child > h1 > span:first-child').text();
    const animeImage = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(1) > img').attr('src');
    const type = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(5) > div > table > tbody > tr:nth-of-type(2) > td:nth-of-type(2)').text();
    const desc = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > p').text()
    const releasedDate = $('div.anime_info_body_bg > p:nth-child(7)')
      .text()
      .replace('Released: ', '');
    const status = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(5) > div > table > tbody > tr:nth-of-type(1) > td:nth-of-type(2)').text();
    const otherName = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(4) > div')
      .text()
      .replace(/;/g, ',');

    $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(2) > a').each((i, elem) => {
      genres.push($(elem).text().trim());
    });

    const ep_end = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(3) > div:nth-of-type(2) > div:nth-of-type(2) > p:nth-of-type(2)').text();
    const studio = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(5) > div > table > tbody > tr:nth-of-type(3) > td:nth-of-type(2) > a').text().replace(/\n/g, '').trim();
    const rating = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(2) > p:nth-of-type(2)').text();
    const age_rate = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(3) > div:nth-of-type(3) > div:nth-of-type(2) > p:nth-of-type(2)').text();

    const malId = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(6) > div > a:nth-of-type(1)').attr('href');
    const wiki = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(6) > div > a:nth-of-type(4)').attr('href');
    const wikiJp = $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(6) > div > a:nth-of-type(5)').attr('href');

    $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(2) > div > div > div:nth-of-type(2) > ul > li > div > a:first-child').each((i, el) => {
      animeRelated.push({
        sirieId: $(el).attr('href').replace('https://anime3rb.com/titles',''),
        sirieName: $(el).find('h2').text(),
        sirieImage: $(el).find('img').attr('src'),
      });
    });

    $('body > div:nth-of-type(2) > div:nth-of-type(4) > main > div > section:nth-of-type(4) > div > div > div:nth-of-type(2) > ul > li > div > a:nth-of-type(1)').each((i, el) => {
      alsoRelated.push({
        sirieId: $(el).attr('href').replace('https://anime3rb.com/titles',''),
        sirieName: $(el).find('h2').text(),
        sirieImage: $(el).find('img').attr('src'),
      });
    });

    
    $('a[href^="https://anime3rb.com/episode/"]').each((i, el) => {
      epList.push({
        episodeId: $(el).attr('href').replace('https://anime3rb.com/episode',''),
        episodeNum: $(el).find('.video-metadata span').text(),
      });
    });

    // Extract all data-src attributes from the iframes
    
    $('iframe').each((i, el) => {
        const src = $(el).attr('data-src').replace('https://www.youtube.com/embed/','');
        if (src) {
            videoSrcs.push(src); // Add to array if src is found
        }
    });

    return {
      name: animeTitle.toString(),
      type: type.toString(),
      released: releasedDate.toString(),
      status: status.toString(),
      genres: genres,
      othername: otherName,
      synopsis: desc.toString(),
      imageUrl: animeImage.toString(),
      studio: studio.toString(),
      rating: rating.toString(),
      age: age_rate.toString(),
      youtube: videoSrcs,
      malId: malId.toString(),
      wiki: wiki.toString(),
      wikiJp: wikiJp.toString(),
      related: animeRelated,
      alsoRelated: alsoRelated,
      totalEpisodes: ep_end,
      episode_id: epList,
      
    };
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeSeason = async ({ list = [], season, page = 1 }) => {
  try {
    const season_page = await axios.get(`${seasons_url}${season}?page=${page}`);
    const $ = cheerio.load(season_page.data);

    $('div.last_episodes > ul > li').each((i, el) => {
      list.push({
        animeId: $(el).find('div > a').attr('href').split('/')[2],
        animeTitle: $(el).find('div > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').html().trim(),
      });
    });

    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeThread = async ({ episodeId, page = 0 }) => {
  try {
    let threadId = null;

    const thread_page = await axios.get(disqus_iframe(decodeURIComponent(episodeId)));
    const $ = cheerio.load(thread_page.data, { xmlMode: true });

    const thread = JSON.parse($('#disqus-threadData')[0].children[0].data);

    if (thread.code === 0 && thread.cursor.total > 0) {
      threadId = thread.response.thread.id;
    }

    const thread_api_res = (await axios.get(disqus_api(threadId, page))).data;

    return {
      threadId: threadId,
      currentPage: page,
      hasNextPage: thread_api_res.cursor.hasNext,
      comments: thread_api_res.response,
    };
  } catch (err) {
    if (err.response.status === 400) {
      return { error: 'Invalid page. Try again.' };
    }
    return { error: err };
  }
};




export const scrapeSearchPage = async ({ keyw, page }) => {
  try {
    const SearchPage = await axios.get(`${BASE_URL + search_path}?keyword=${keyw}&page=${page}`);

    const $ = cheerio.load(SearchPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapePopularPage = async ({ page }) => {
  try {
    const PopularPage = await axios.get(`${BASE_URL}/popular.html?page=${page}`);

    const $ = cheerio.load(PopularPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeCompletedPage = async ({ page }) => {
  try {
    const CompletedPage = await axios.get(`${BASE_URL}/completed-anime.html?page=${page}`);

    const $ = cheerio.load(CompletedPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeOngoingPage = async ({ page }) => {
  try {
    const OngoingPage = await axios.get(`${BASE_URL}/ongoing-anime.html?page=${page}`);

    const $ = cheerio.load(OngoingPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeMoviePage = async ({ page }) => {
  try {
    const MoviePage = await axios.get(`${BASE_URL}/anime-movies.html?aph=&page=${page}`);

    const $ = cheerio.load(MoviePage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};


export const scrapeSubCategoryPage = async ({ subCategory, page }) => {
  try {
    const SubCategoryPage = await axios.get(`${BASE_URL}/sub-category/${subCategory}?page=${page}`);

    const $ = cheerio.load(SubCategoryPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeRecentPage = async ({ page, type }) => {
  try {
    const RecentPage = await axios.get(`${recent_release_url}?page=${page}&type=${type}`);

    const $ = cheerio.load(RecentPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeNewSeasonPage = async ({ page }) => {
  try {
    const NewSeasonPage = await axios.get(`${BASE_URL}/new-season.html?page=${page}`);

    const $ = cheerio.load(NewSeasonPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeGenrePage = async ({ genre, page }) => {
  try {
    const GenrePage = await axios.get(`https://anime3rb.com/genre/${genre}?page=${page}`);

    const $ = cheerio.load(GenrePage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeAnimeListPage = async ({ page }) => {
  try {
    const AnimeListPage = await axios.get(`${BASE_URL}/titles/list?page=${page}`);

    const $ = cheerio.load(AnimeListPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeAnimeAZPage = async ({ aph, page = 1 }) => {
  try {
    const AnimeAZPage = await axios.get(`${BASE_URL}/anime-list-${aph}?page=${page}`);

    const $ = cheerio.load(AnimeAZPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};
