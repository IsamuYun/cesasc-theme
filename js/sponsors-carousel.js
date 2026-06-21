/**
 * @file
 * Sponsors logo-card carousel behavior.
 */
(function (Drupal, once) {

  'use strict';

  var CARD_SIZE = 180;
  var MAX_VISIBLE_CARDS = 10;
  var AUTOPLAY_DELAY = 8000;

  Drupal.behaviors.cesascSponsorsCarousel = {
    attach: function (context) {
      once('cesasc-sponsors-carousel', '.js-sponsors-carousel', context).forEach(function (carousel) {
        var source = carousel.querySelector('.sponsors-carousel-block__source');
        var viewport = carousel.querySelector('[data-sponsors-viewport]');
        var previousButton = carousel.querySelector('[data-sponsors-previous]');
        var nextButton = carousel.querySelector('[data-sponsors-next]');
        var toggleButton = carousel.querySelector('[data-sponsors-toggle]');

        if (!source || !viewport || !previousButton || !nextButton || !toggleButton) {
          return;
        }

        var cards = Array.prototype.slice.call(source.querySelectorAll('a'));
        if (!cards.length) {
          previousButton.disabled = true;
          nextButton.disabled = true;
          toggleButton.disabled = true;
          return;
        }

        var track = document.createElement('div');
        track.className = 'sponsors-carousel-block__track';
        track.setAttribute('role', 'list');

        cards.forEach(function (card) {
          var images = card.querySelectorAll('img');
          var accessibleName = getCardName(card, images);
          var item = document.createElement('div');

          card.classList.add('sponsors-carousel-block__card');
          item.className = 'sponsors-carousel-block__item';
          item.setAttribute('role', 'listitem');

          if (accessibleName && !card.getAttribute('aria-label')) {
            card.setAttribute('aria-label', accessibleName);
          }

          if (card.getAttribute('target') === '_blank') {
            card.setAttribute('rel', 'noopener noreferrer');
          }

          item.appendChild(card);
          track.appendChild(item);
        });

        source.replaceChildren(track);

        var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        var visibleCount = 1;
        var pageStart = 0;
        var autoplayTimer;
        var userPaused = false;
        var interactionPaused = false;
        var resizeFrame;

        var updateToggle = function () {
          var isPaused = userPaused || reducedMotion.matches;
          toggleButton.textContent = isPaused ? Drupal.t('Play') : Drupal.t('Pause');
          toggleButton.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
          toggleButton.disabled = reducedMotion.matches || cards.length <= visibleCount;
        };

        var getLastPageStart = function () {
          return Math.floor((cards.length - 1) / visibleCount) * visibleCount;
        };

        var renderPage = function (animate) {
          if (!animate) {
            track.style.transition = 'none';
          }

          track.style.transform = 'translate3d(' + (-pageStart * CARD_SIZE) + 'px, 0, 0)';

          if (!animate) {
            window.requestAnimationFrame(function () {
              track.style.removeProperty('transition');
            });
          }
        };

        var changePage = function (direction, animate) {
          var lastPageStart = getLastPageStart();
          var wrapped = false;

          if (direction > 0) {
            if (pageStart >= lastPageStart) {
              pageStart = 0;
              wrapped = true;
            }
            else {
              pageStart += visibleCount;
            }
          }
          else {
            if (pageStart <= 0) {
              pageStart = lastPageStart;
              wrapped = true;
            }
            else {
              pageStart = Math.max(0, pageStart - visibleCount);
            }
          }

          renderPage(animate && !wrapped);
        };

        var stopAutoplay = function () {
          window.clearInterval(autoplayTimer);
          autoplayTimer = undefined;
        };

        var startAutoplay = function () {
          stopAutoplay();

          if (userPaused || interactionPaused || reducedMotion.matches || cards.length <= visibleCount || document.hidden) {
            return;
          }

          autoplayTimer = window.setInterval(function () {
            changePage(1, true);
          }, AUTOPLAY_DELAY);
        };

        var updateLayout = function () {
          var availableWidth = Math.min(carousel.clientWidth, CARD_SIZE * MAX_VISIBLE_CARDS);
          visibleCount = Math.max(1, Math.min(MAX_VISIBLE_CARDS, Math.floor(availableWidth / CARD_SIZE)));
          viewport.style.width = (visibleCount * CARD_SIZE) + 'px';
          pageStart = Math.min(
            Math.floor(pageStart / visibleCount) * visibleCount,
            getLastPageStart()
          );
          renderPage(false);
          previousButton.disabled = cards.length <= visibleCount;
          nextButton.disabled = cards.length <= visibleCount;
          updateToggle();
          startAutoplay();
        };

        previousButton.addEventListener('click', function () {
          changePage(-1, true);
          startAutoplay();
        });

        nextButton.addEventListener('click', function () {
          changePage(1, true);
          startAutoplay();
        });

        toggleButton.addEventListener('click', function () {
          userPaused = !userPaused;
          updateToggle();
          startAutoplay();
        });

        carousel.addEventListener('mouseenter', function () {
          interactionPaused = true;
          stopAutoplay();
        });

        carousel.addEventListener('mouseleave', function () {
          interactionPaused = false;
          startAutoplay();
        });

        carousel.addEventListener('focusin', function () {
          interactionPaused = true;
          stopAutoplay();
        });

        carousel.addEventListener('focusout', function (event) {
          if (!carousel.contains(event.relatedTarget)) {
            interactionPaused = false;
            startAutoplay();
          }
        });

        document.addEventListener('visibilitychange', startAutoplay);
        reducedMotion.addEventListener('change', function () {
          updateToggle();
          startAutoplay();
        });
        window.addEventListener('resize', function () {
          window.cancelAnimationFrame(resizeFrame);
          resizeFrame = window.requestAnimationFrame(updateLayout);
        });

        updateToggle();
        updateLayout();
      });
    }
  };

  function getCardName(card, images) {
    for (var index = 0; index < images.length; index++) {
      var alt = (images[index].getAttribute('alt') || '').trim();

      if (alt) {
        return alt;
      }

      var source = images[index].getAttribute('src') || '';
      var filename = source.split('/').pop().split('?')[0];

      if (filename) {
        return filename
          .replace(/%20/gi, ' ')
          .replace(/\.[^.]+$/, '')
          .replace(/[_-]+/g, ' ')
          .trim();
      }
    }

    return card.getAttribute('href') || Drupal.t('Sponsor');
  }

})(Drupal, once);
