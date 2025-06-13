import onChange from 'on-change';
import _ from 'lodash';

export default (state, elements, i18nInstance) => {
  const watchedState = onChange(state, (path, currentValue) => {
    const { feedBackEl, input } = elements;
    const submitButton = document.querySelector('[type="submit"]');

    const updateFeedback = (type, message) => {
      feedBackEl.textContent = message;
      feedBackEl.classList.toggle('text-danger', type === 'error');
      feedBackEl.classList.toggle('text-success', type === 'success');
    };

    if (path === 'form.status') {
      if (currentValue === 'sending') {
        submitButton.setAttribute('disabled', true);
      } else {
        submitButton.removeAttribute('disabled');
      }
    }

    if (path === 'form.feedback') {
      if (currentValue === i18nInstance.t('success')) {
        updateFeedback('success', currentValue);
      } else {
        updateFeedback('error', currentValue);
      }
    }

    if (path === 'form.isValid') {
      input.classList.toggle('is-invalid', !currentValue);
    }

    if (path === 'feeds') {
      const feedsDiv = document.querySelector('.feeds');
      feedsDiv.innerHTML = `<div class="card border-0">
    <div class="card-body"><h2 class="card-title h4">Фиды</h2></div>
    <ul class="list-group border-0 rounded-0"></ul></div>`;
      const list = feedsDiv.querySelector('ul');
      state.feeds.forEach((feed) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'border-0', 'border-end-0');
        li.innerHTML = `<h3 class="h6 m-0">${feed.title}</h3>
      <p class="m-0 small text-black-50">${feed.description}</p>`;
        list.appendChild(li);
      });
    }

    if (path === 'posts') {
      const postsDiv = document.querySelector('.posts');
      postsDiv.innerHTML = `<div class="card border-0">
    <div class="card-body"><h2 class="card-title h4">Посты</h2></div>
    <ul class="list-group border-0 rounded-0"></ul></div></div>`;
      const list = postsDiv.querySelector('ul');
      watchedState.posts.forEach((post) => {
        const li = document.createElement('li');
        li.classList.add(
          'list-group-item',
          'd-flex',
          'justify-content-between',
          'align-items-start',
          'border-0',
          'border-end-0',
        );
        li.innerHTML = `<a href="${post.link}" class="fw-bold" data-id="${post.id}" target="_blank" rel="noopener noreferrer">${post.title}</a>
      <button type="button" class="btn btn-outline-primary btn-sm" data-id="${post.id}" data-bs-toggle="modal" data-bs-target="#modal">Просмотр</button></li>`;
        list.appendChild(li);
      });
    }

    if (path === 'modalId') {
      const currentPost = watchedState.posts.find((post) => post.id === currentValue);
      const modalTitle = document.querySelector('.modal-title');
      const modalBody = document.querySelector('.modal-body');
      const modalLink = document.querySelector('a.full-article');
      modalTitle.textContent = currentPost.title;
      modalBody.textContent = currentPost.description;
      modalLink.setAttribute('href', currentPost.link);
    }

    if (path === 'visitedLinks') {
      const id = _.last(currentValue);
      const link = document.querySelector(`a[data-id="${id}"]`);
      link.classList.replace('fw-bold', 'fw-normal');
      link.classList.add('link-secondary');
    }
  });
  return watchedState;
};
