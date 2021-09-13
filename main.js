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
  let minNum = 1;
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
    maxNum = await fetchMaxNum();
    loadReader();
  }

  function fetchMaxNum() {
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

  function getMaxNum() {
    return maxNum;
  }

  async function loadReader() {
    displayController.showLoading();
    const comics = await arrangeComics(currSize, currNum);
    displayController.renderComics(comics);
  }

  async function arrangeComics(size, currNum) {
    let indexes = getRollingRange(size, minNum, currNum, maxNum)
    console.log(indexes);

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
    loadReader();
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
    loadReader();
  }

  function setCurrNum(num) {
    currNum = num;
    loadReader();
  }

  function getRollingRange(size, minVal, middleVal, maxVal) {
    const sizeAdjacent = Math.ceil((size - 1) / 2);
    const firstNumBefore = middleVal - sizeAdjacent;
    const lastNumAfter = middleVal + sizeAdjacent;

    let array = []
    
    // OBJECTIVE: Generate array of numbers of given size, around middleVal, within range (minVal, maxVal)
    // Assumption: middleVal provided is always within range
    
    // STEP 1: Generate array of numbers within range
    for (let i = clamp(firstNumBefore); i <= clamp(lastNumAfter); i++) {
      array.push(i);
    }
    
    // STEP 2: If size is sufficient, return array
    if (array.length === size) return array;
    
    // STEP 3: Otherwise, add additional adjacent values as required on either side of array
    for (let i = 0; i < (minVal - firstNumBefore); i++) {
      array.unshift(maxVal - i);
    }
    
    for (let i = 0; i < (lastNumAfter - maxVal); i++) {
      array.push(minVal + i);
    }

    return array;
  }
  
  function clamp(val) {
    // Returns val if within range (minNum, maxNum)
      // Else returns minNum if val < minNum
      // Else returns maxNum if val > maxNum
    return Math.min(Math.max(val, minNum), maxNum);
  }

  return {
    init,
    setCurrSize,
    shiftCurrNum,
    setCurrNum,
    getMaxNum
  };
})();

const displayController = (() => {
  // Responsible for displaying content

  const comicsContainer = document.querySelector('#comics-container');
  const navBtns = document.querySelectorAll('.controls-nav');
  const sizeBtns = document.querySelectorAll('.controls-size');
  const reqComicForm = document.querySelector('#request-comic-form');

  function initInterface(controller) {
    sizeBtns.forEach(sizeBtn => sizeBtn.addEventListener('click', handleSizeChange(controller)));
    navBtns.forEach(navBtn => navBtn.addEventListener('click', handleNavClick(controller)));
    reqComicForm.addEventListener('submit', handleRequestComic(controller));
  }

  function handleSizeChange(controller) {
    return e => {
      const size = Number(e.target.dataset.size);
      controller.setCurrSize(size);
    }
  }

  function handleNavClick(controller) {
    return e => {
      const type = e.target.dataset.nav;
      controller.shiftCurrNum(type);
    }
  }

  function handleRequestComic(controller) {
    return e => {
      e.preventDefault();
      const index = Number(e.target.elements['comic-index'].value);
      const maxNum = controller.getMaxNum();
      if (index >= 1 && index <= maxNum) {
        controller.setCurrNum(index);
      } else {
        e.target.elements['comic-index'].value = `Range available 1 - ${maxNum}`;
      }
    }
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

  function showLoading() {
    // Reset comics displayed
    comicsContainer.innerHTML = '';

    // Display Loading animation
    const loadingText = document.createElement('h2');
    loadingText.innerText = "Loading...";
    comicsContainer.append(loadingText);
  }

  return {
    initInterface,
    renderComics,
    showLoading
  };
})();

displayController.initInterface(contentController);
contentController.init();
