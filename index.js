function declensionOfNumber(number, titles) {
  return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(number % 10 < 5) ? number % 10 : 5]];
}

function randomChannel() {
  return Math.round(255 * Math.random());
}

function jsonToQueryString(json) {
  return '?' + Object.keys(json).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(json[key])).join('&');
}

const TRANSLATE_URL = 'https://translate.yandex.net/api/v1.5/tr.json/translate';
const TRANSLATE_API_KEY = 'trnsl.1.1.20171006T172012Z.d0ea7bb95ec669cf.456c9a14cc8be6b7e7a6bd4a62a4049c55d042b9';

// function randomColor(alpha = 1) {
// 	const red = randomChannel();
// 	const green = randomChannel();
// 	const blue = randomChannel();

// 	return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
// }

function createDefaultOptions(size) {
  let quoteText = declensionOfNumber(size, ['книга', 'книги', 'книг']);

  return `
		<option value="">Все ${size} ${quoteText}</option>
		<option disabled="disabled">———</option>
	`;
}

function createOption(book) {
  return `
		<option value="${book.id}">${book.title}</option>
	`;
}

function createPair(pair) {
  return `
    <span class="pair">
      <span class="pair__translated">${ pair.translated }</span>
      <span class="pair__original">${ pair.original }</span>
    </span>
  `
}

document.addEventListener('DOMContentLoaded', () => {
  let userNameEl = document.getElementById('user-name');
  let booksEl = document.getElementById('books');
  let formEl = document.getElementById('form');
  let loadingEl = document.getElementById('loading');
  let nextCiteButton = document.getElementById('next-cite');
  let quoteTextEl = document.getElementById('quote-text');
  let countEl = document.getElementById('count');
  let currentIndexEl = document.getElementById('current-index');
  let allCountEl = document.getElementById('all-count');
  let bookImage = document.getElementById('book-image');
  let bookTitle = document.getElementById('book-title');
  let bookAuthor = document.getElementById('book-author');

  let filteredQuotes = [];

  function updateQuote() {
    const index = Math.round(Math.random() * (filteredQuotes.length - 1));
    const quote = filteredQuotes[index];

    const payload = {
      key: TRANSLATE_API_KEY,
      text: quote.quote,
      lang: 'ru-en',
      format: 'plain',
      options: 4
    };

    fetch(TRANSLATE_URL + jsonToQueryString(payload))
      .then(data => data.json())
      .then(json => {
        const {align: [map], text: [text]} = json;

        const pairs = map.split(',')
          .slice(1) // Первым элементом в массиве приходит весь перевод
          .map(pair => {
            pair = pair.split(';')[0]; // Отбросываем предложения

            const [original, translated] = pair.split('-');
            const [originalFrom, originalTo] = original.split(':').map(Number);
            const [translatedFrom, translatedTo] = translated.split(':').map(Number);

            return {
              original: quote.quote.substr(originalFrom, originalTo),
              translated: text.substr(translatedFrom, translatedTo)
            };
          });

        quoteTextEl.innerHTML = pairs.map(createPair).join('');
        currentIndexEl.textContent = index + 1;
        allCountEl.textContent = filteredQuotes.length;
        bookImage.src = quote.book.cover.url;
        bookTitle.textContent = quote.book.title;
        bookAuthor.textContent = quote.book.authors;
      });

    // document.body.style.backgroundColor = randomColor(.1);
  }

  function afterQuotesLoaded(quotes) {
    loadingEl.classList.add('g-hidden');
    booksEl.classList.remove('g-hidden');
    countEl.classList.remove('g-hidden');
    booksEl.focus();

    function showFilteredQuotes(bookId) {
      filteredQuotes = (
        bookId
          ? quotes.filter(quote => quote.book.id === bookId)
          : quotes
      );

      updateQuote();
    }

    let books = [];

    quotes.forEach(quote => {
      if (!books.find(book => book.id === quote.book.id)) {
        books.push({
          id: quote.book.id,
          title: quote.book.title
        })
      }
    });

    booksEl.innerHTML = [
      ...createDefaultOptions(books.length),
      books.map(createOption)
    ].join('');

    booksEl.addEventListener('change', () => {
      let selected = booksEl.selectedOptions[0];
      showFilteredQuotes(selected.value);
    });

    showFilteredQuotes('');
  }

  if (localStorage.getItem(userNameEl.value)) {
    afterQuotesLoaded(JSON.parse(localStorage.getItem(userNameEl.value)));
  }

  nextCiteButton.addEventListener('click', updateQuote);

  formEl.addEventListener('submit', e => {
    e.preventDefault();

    loadingEl.classList.remove('g-hidden');
    booksEl.classList.add('g-hidden');

    getQuotes(userNameEl.value).then(quotes => {

      localStorage.setItem(userNameEl.value, JSON.stringify(quotes));

      /*function groupBy(array, prop) {
       return array.reduce((grouped, item) => {
       let key = item[prop];
       if (!grouped[key]) {
       grouped[key] = [];
       }
       grouped[key].push(item);
       return grouped;
       }, {});
       }

       console.log(Object.keys(
       groupBy(quotes, 'bookId')
       ));*/

      afterQuotesLoaded(quotes);
    });
  });
});