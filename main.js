const comicFactory = (data) => {
  const comic = {};
  
  comic.title = data.title;
  comic.imageURL = data.img;
  comic.num = data.num;
  comic.captions = (data.transcript.split(/{{.*}}*/))[0].split('\n\n');
  comic.altText = data.alt;
  comic.info = data;
  
  return comic;
};

const contentController = (() => {
  // Responsible for deciding what content to display
  let maxNum = 2475;
  let currNum = 1;
  let currSize = 3;

  function getData(index) {
    const url = `https://xkcd.vercel.app/?comic=${index}`;

    const comic = fetch(url)
    // Extract json from http response
    .then(result => result.json())
    // Save data to comic
    .then(data => {
      return data;
    });

    return comic;
  }

  async function init() {
    maxNum = await getMaxNum();
    loadReader();
  }

  function getMaxNum() {
    const urlLatest = 'https://xkcd.vercel.app/?comic=latest'

    const numLatest = fetch(urlLatest)
    // Extract json from http response
    .then(result => result.json())
    // Extract and return comic index
    .then(data => {
      return Number(data.num);
    })

    return numLatest;
  }

  async function loadReader() {
    const comics = await arrangeComics(currSize, currNum, maxNum);
    displayController.renderComics(comics);
  }

  async function arrangeComics(size, currNum, maxNum) {
    let indexes = getRollingRange(size, currNum, maxNum)
    
    // Generate a comic for each num in 'indexes'
    return await generateComics(indexes);
  }

  async function generateComics(indexArr) {
    let comics = [];
    let data = [];

    for (const i of indexArr) {
      data.push(getData(i));
    }

    const comicsData = await Promise.all(data)
    comicsData.forEach(comic => {
      const newComic = comicFactory(comic);
      comics.push(newComic)
    });
    return comics;
  }

  function setCurrSize(size) {
    currSize = size;
  }

  function shiftCurrNum(type) {
    switch (type) {
      case 'prev':
        currNum -= currSize
        if (currNum < 1) currNum = maxNum + currNum;
        break;
      case 'next':
        currNum += currSize
        if (currNum > maxNum) currNum = currNum - maxNum;
        break;
      case 'random':
        currNum = Math.floor(Math.random() * maxNum)
        break;
      default:
        console.log('Invalid navigation attempt');
    }
  }

  function getRollingRange(size, middleVal, maxVal) {
    const sizeAdjacent = Math.ceil((size -1) / 2);
    const firstNumBefore = middleVal - sizeAdjacent;
    const lastNumAfter = middleVal + sizeAdjacent;

    let array = []
    
    // OBJECTIVE: Add all comic numbers to 'array', up to current comic
    if (firstNumBefore < 1) {
      // Approach 1: When comics before '#1' need to be displayed
      // Count backwards from #Max
      for (let i = 0; i <= Math.abs(firstNumBefore); i++) {
        array.unshift(maxVal - i);
      }
      // Add numbers from 1 to #Current
      if (middleVal > 0) {
        for (let i = 1; i <= middleVal; i++) {
          array.push(i);
        }
      }
    }
    else {
      // Approach 2: When no comics before '#1' need to be displayed
      // Count backwards from #Current
      for (let i = 0; i <= sizeAdjacent; i++) {
        array.unshift(middleVal - i);
      }
    }

    // OBJECTIVE: Add all comic numbers to 'array', after current comic
    if (lastNumAfter > maxVal) {
      // Approach 1: When comics after '#Max' need to be displayed
      // Count forwards until #Max
      if (middleVal < maxVal) {
        for (let i = middleVal + 1; i <= maxVal; i++) {
          array.push(i);
        }
      }
      // Count forwards from 1
      for (let i = 1; i < (lastNumAfter - maxVal); i++) {
        array.push(i);
      }
    }
    else {
      // Approach 2: When no comics after '#Max' need to be displayed
      // Count forwards from #Current
      for (let i = 1; i <= sizeAdjacent; i++) {
        array.push(middleVal + i)
      }
    }

    return array;
  }

  return {
    init,
    loadReader,
    setCurrSize,
    shiftCurrNum
  };
})();

const displayController = ((contentController) => {
  // Responsible for displaying content

  const comicsContainer = document.querySelector('#comics-container');
  const navBtns = document.querySelectorAll('.controls-nav');
  const sizeBtns = document.querySelectorAll('.controls-size');

  function initInterface() {
    sizeBtns.forEach(sizeBtn => sizeBtn.addEventListener('click', handleSizeChange));
    navBtns.forEach(navBtn => navBtn.addEventListener('click', handleNavClick));
  }

  function handleSizeChange(e) {
    const size = Number(e.target.dataset.size);
    contentController.setCurrSize(size);
    contentController.loadReader();
  }

  function handleNavClick(e) {
    const type = e.target.dataset.nav;
    contentController.shiftCurrNum(type);
    contentController.loadReader();
  }

  function renderComics(comicsData) {
    // Reset comics displayed
    comicsContainer.innerHTML = '';

    // Render given comics
    comicsData.forEach(comicData => {
      const comicHTML = createComic(comicData);
      comicsContainer.append(comicHTML);
    });
  }

  function createComic(data) {
    const comic = document.createElement('div');
    comic.classList.add('comic');
    comic.setAttribute('data-num', data.num);

    const title = document.createElement('div');
    title.classList.add('title');
    title.innerText = `${data.title} [#${data.num}]`;

    const image = document.createElement('img');
    image.classList.add('image');
    image.setAttribute('src', data.imageURL);
    image.setAttribute('alt', data.altText);

    const captions = document.createElement('div');
    captions.classList.add('captions-container');

    data.captions.forEach(captionData => {
      const caption = document.createElement('p');
      caption.classList.add('caption');
      caption.innerText = captionData;
      captions.append(caption);
    });

    comic.append(title, image, captions);

    return comic;
  }

  return {
    initInterface,
    renderComics
  };
})(contentController);

displayController.initInterface();
contentController.init();
