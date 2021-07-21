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

  function initReader() {
    getData(1)
    .then(comic => {
      const newComic = comicFactory(comic);
      displayController.renderComics([newComic]);
    });
  }

  return {
    initReader
  };
})();

const displayController = (() => {
  // Responsible for displaying content

  const comicsContainer = document.querySelector('#comics-container');

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
    title.innerText = data.title;

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
    console.log(data);

    comic.append(title, image, captions);

    return comic;
  }

  return {
    renderComics
  };
})();

contentController.initReader();
