import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import resources from './locales/index.js';
import watch from './view.js';

const parseDOM = (data) => {
  const parser = new DOMParser();
  return parser.parseFromString(data, 'application/xml');
};

const routes = {
  allOrigins: () => 'https://allorigins.hexlet.app/get?disableCache=true&url=',
};

const i18nInstance = i18next.createInstance();
i18nInstance.init({
  lng: 'ru',
  debug: true,
  resources,
});

const state = {
  addedUrls: [],
  posts: [],
  feeds: [],
  visitedLinks: [],
  modalId: '',

  form: {
    isValid: true,
    status: 'filling', // filling, sending
    feedback: '',
  },
};

const validateUrl = (url) => {
  const schema = yup
    .string()
    .url(i18nInstance.t('errors.invalidURL'))
    .notOneOf(state.addedUrls, i18nInstance.t('errors.alreadyExist'))
    .required(i18nInstance.t('errors.required'));
  return schema.validate(url);
};

const form = document.querySelector('.rss-form');
const input = document.querySelector('#url-input');
const feedBackEl = document.querySelector('.feedback');

const watchedState = watch(state, { input, feedBackEl }, i18nInstance);

const checkForNewPosts = () => {
  const promises = state.addedUrls.map((url) => axios
    .get(`${routes.allOrigins()}${url}`, { timeout: 10000 })
    .then((response) => {
      const parsedData = parseDOM(response.data.contents);
      const posts = parsedData.querySelectorAll('item');
      const newPostsArray = [];
      posts.forEach((post) => {
        const postTitle = post.querySelector('title').textContent;
        const postDescription = post.querySelector('description').textContent;
        const postLink = post.querySelector('link').textContent;
        const postId = post.querySelector('guid')
          ? post.querySelector('guid').textContent
          : postLink;
        if (!_.some(state.posts, ['id', postId])) {
          newPostsArray.push({
            id: postId,
            title: postTitle,
            description: postDescription,
            link: postLink,
          });
        }
      });
      watchedState.posts.unshift(...newPostsArray);
    })
    .catch((err) => {
      console.error(err);
    }));
  Promise.all(promises).finally(() => {
    setTimeout(checkForNewPosts, 5000);
  });
};

form.addEventListener('submit', (e) => {
  console.log('Form submitted');
  e.preventDefault();
  const formData = new FormData(e.target);
  const url = formData.get('url');

  validateUrl(url)
    .then((validUrl) => {
      watchedState.form.feedback = '';
      watchedState.form.isValid = true;
      watchedState.form.status = 'sending';
      return axios.get(`${routes.allOrigins()}${validUrl}`, {
        timeout: 10000,
      });
    })
    .then((response) => {
      const parsedData = parseDOM(response.data.contents);
      const errorNode = parsedData.querySelector('parsererror');
      if (errorNode) {
        watchedState.form.feedback = i18nInstance.t('errors.notContainRSS');
        return;
      }
      watchedState.addedUrls.push(url);
      watchedState.form.feedback = i18nInstance.t('success');

      const feedtitle = parsedData.querySelector('title');
      const feedDescription = parsedData.querySelector('description');
      watchedState.feeds.unshift({
        title: feedtitle.textContent,
        description: feedDescription.textContent,
      });

      const posts = parsedData.querySelectorAll('item');
      const postsArray = [];
      posts.forEach((post) => {
        const postTitle = post.querySelector('title').textContent;
        const postDescription = post.querySelector('description').textContent;
        const postLink = post.querySelector('link').textContent;
        const postId = post.querySelector('guid')
          ? post.querySelector('guid').textContent
          : postLink;
        postsArray.unshift({
          id: postId,
          title: postTitle,
          description: postDescription,
          link: postLink,
        });
      });
      postsArray.reverse();
      watchedState.posts.unshift(...postsArray);
      e.target.reset();
      input.focus();
      watchedState.form.status = 'filling';
      checkForNewPosts();
    })
    .catch((err) => {
      watchedState.form.isValid = false;
      if (axios.isAxiosError(err)) {
        if (err.request) {
          watchedState.form.feedback = i18nInstance.t('errors.networkError');
        }
      } else {
        watchedState.form.feedback = err.message;
      }
      watchedState.form.status = 'filling';
    });
});

const modal = document.getElementById('modal');
modal.addEventListener('show.bs.modal', (e) => {
  const currentPostId = e.relatedTarget.getAttribute('data-id');
  watchedState.visitedLinks.push(currentPostId);
  watchedState.modalId = currentPostId;
});

const links = document.querySelectorAll('.fw-bold');
links.forEach((link) => {
  link.addEventListener('click', () => {
    const linkId = link.getAttribute('data-id');
    watchedState.visitedLinks.push(linkId);
  });
});
