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
  const maxNum = 2475;
  let currNum = 3;
  let currSize = 3;

  function getData(index) {
    const url = `https://intro-to-js-playground.vercel.app/api/xkcd-comics/${index}`;

    const comic = fetch(url)
    // Extract json from http response
    .then(result => result.json())
    // Save data to comic
    .then(data => {
      return data;
    });

    return comic;
  }

  async function initReader() {
    const comics = await arrangeComics(currSize, currNum, maxNum);
    displayController.renderComics(comics);
  }

  async function arrangeComics(size, currNum, maxNum) {
    let comics = [];

    const sizeBefore = Math.ceil((size - 1) / 2);
    const sizeAfter = size - sizeBefore - 1;

    let firstNumBefore = currNum - sizeBefore;
    let lastNumBefore = currNum - 1;

    let firstNumAfter = currNum + 1;
    let lastNumAfter = currNum + sizeAfter;

    // Validate number range before current comic
    if (firstNumBefore < 1) {
      let sizeBeforeOne = sizeBefore - currNum + 1;
      comics.push(generateComics(maxNum - sizeBeforeOne - 1, maxNum));
      comics.push(generateComics(1, currNum - 1));
    }
    else {
      comics.push(generateComics(firstNumBefore, lastNumBefore));
    }

    // Current comic
    comics.push(generateComics(currNum, currNum));

    // Validate number range after current comic
    if (lastNumAfter > maxNum) {
      let sizeAfterMax = currNum + sizeAfter - maxNum;
      comics.push(generateComics(currNum + 1, maxNum));
      comics.push(generateComics(1, sizeAfterMax));
    }
    else {
      comics.push(generateComics(firstNumAfter, lastNumAfter));
    }

    const results = await Promise.all(comics);
    return results.flat()
  }

  async function generateComics(startNum, endNum) {
    let comics = [];
    let data = [];

    for (let i = startNum; i <= endNum; i++) {
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

  return {
    initReader,
    setCurrSize,
    shiftCurrNum
  };
})();

const displayController = (() => {
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
    contentController.initReader();
  }

  function handleNavClick(e) {
    const type = e.target.dataset.nav;
    contentController.shiftCurrNum(type);
    contentController.initReader();
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
})();

displayController.initInterface();
contentController.initReader();
