// MAIN MODULE

const Reader = (() => {
  let dataModule = undefined;
  let displayModule = undefined;
  
  async function init(dataMod, displayMod) {
    dataModule = dataMod;
    displayModule = displayMod;
    
    // Init Sub-Modules
    displayModule.showLoading();
    await dataModule.init();
    const maxVal = dataModule.getMaxNum();
    displayModule.init({maxVal, setSizeHandler, setNumHandler, shiftNumHandler});
    
    // Get and Render Comics Data
    const data = await dataModule.generateData();
    displayModule.renderComics(data);
  }
  
  async function reload() {
    displayModule.showLoading();
    const data = await dataModule.generateData();
    displayModule.renderComics(data);
  }
  
  const setSizeHandler = (size) => {
    dataModule.setCurrSize(size);
    reload();
  }
  
  const setNumHandler = (num) => {
    dataModule.setCurrNum(num);
    reload();
  }
  
  const shiftNumHandler = (type) => {
    dataModule.shiftCurrNum(type);
    reload();
  }
  
  return { init }
})();


// SUB-MODULES

const ContentController = (() => {
  // Responsible for deciding what content to display
  let minNum = 1;
  let maxNum = 2475;
  let currNum = 1;
  let currSize = 3;
  
  const comicFactory = (data) => {
    const comic = {};
    
    comic.title = data.title;
    comic.imageURL = data.img;
    comic.num = data.num;
    comic.captions = (data.transcript.split(/{{.*}}*/))[0].split('\n');
    comic.altText = data.alt;
    comic.info = data;
    
    return comic;
  };

  async function init() {
    maxNum = await fetchMaxNum();
  }
  
  async function generateData() {
    let indexes = getRollingRange(currSize, minNum, currNum, maxNum)
    
    // Generate a comic for each num in 'indexes'
    return await generateComics(indexes);
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

  function setCurrNum(num) {
    currNum = num;
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
    getMaxNum,
    generateData
  };
})();

const DisplayController = (() => {
  // Responsible for displaying content
  let maxNum = 0;

  const comicsContainer = document.querySelector('#comics-container');
  const navBtns = document.querySelectorAll('.controls-nav');
  const sizeBtns = document.querySelectorAll('.controls-size');
  const reqComicForm = document.querySelector('#request-comic-form');

  function init({maxVal, setSizeHandler, setNumHandler, shiftNumHandler}) {
    sizeBtns.forEach(sizeBtn => sizeBtn.addEventListener('click', handleSizeChange(setSizeHandler)));
    navBtns.forEach(navBtn => navBtn.addEventListener('click', handleNavClick(shiftNumHandler)));
    reqComicForm.addEventListener('submit', handleRequestComic(setNumHandler));
    maxNum = maxVal;
  }

  function handleSizeChange(handleChange) {
    return e => {
      const size = Number(e.currentTarget.dataset.size);
      handleChange(size);
      // Update active size button
      sizeBtns.forEach(btn => btn.classList.remove('active'))
      e.currentTarget.classList.add('active');
    }
  }

  function handleNavClick(handleChange) {
    return e => {
      const type = e.target.dataset.nav;
      handleChange(type);
    }
  }

  function handleRequestComic(handleChange) {
    return e => {
      e.preventDefault();
      const index = Number(e.target.elements['comic-index'].value);
      if (index >= 1 && index <= maxNum) {
        handleChange(index);
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
      
      // Identify image descriptions (surrounded by double square brackets)
      if (captionData.startsWith('[[')) caption.classList.add('img-desc');
      
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
    init,
    renderComics,
    showLoading
  };
})();


// RUN CODE

Reader.init(ContentController, DisplayController);