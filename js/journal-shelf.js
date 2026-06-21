/**
 * @file
 * Journal shelf carousel behavior.
 */
(function (Drupal, once) {

  'use strict';

  Drupal.behaviors.cesascJournalShelf = {
    attach: function (context) {
      once('cesasc-journal-shelf', '.js-journal-shelf-carousel', context).forEach(function (carousel, carouselIndex) {
        var track = carousel.querySelector('.view-content');
        var previousButton = carousel.querySelector('[data-journal-shelf-previous]');
        var nextButton = carousel.querySelector('[data-journal-shelf-next]');

        if (!track || !previousButton || !nextButton) {
          return;
        }

        var cards = Array.prototype.filter.call(track.children, function (child) {
          return child.classList.contains('views-row');
        });

        if (!cards.length) {
          previousButton.disabled = true;
          nextButton.disabled = true;
          return;
        }

        track.classList.add('journal-shelf-block__track');
        track.setAttribute('tabindex', '0');

        if (!track.id) {
          track.id = 'journal-shelf-track-' + carouselIndex;
        }

        previousButton.setAttribute('aria-controls', track.id);
        nextButton.setAttribute('aria-controls', track.id);

        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        var scrollFrame;
        var currentIndex = 0;

        var getGap = function () {
          var styles = window.getComputedStyle(track);
          return parseFloat(styles.columnGap || styles.gap) || 0;
        };

        var getStep = function () {
          return cards[0].getBoundingClientRect().width + getGap();
        };

        var getVisibleCount = function () {
          return Math.max(1, Math.round((track.clientWidth + getGap()) / getStep()));
        };

        var getMaxIndex = function () {
          return Math.max(0, cards.length - getVisibleCount());
        };

        var getPageStops = function () {
          var visibleCount = getVisibleCount();
          var maxIndex = getMaxIndex();
          var stops = [];

          for (var index = 0; index <= maxIndex; index += visibleCount) {
            stops.push(index);
          }

          if (stops[stops.length - 1] !== maxIndex) {
            stops.push(maxIndex);
          }

          return stops;
        };

        var getScrollTarget = function (index) {
          return cards[index].offsetLeft - cards[0].offsetLeft;
        };

        var getCurrentStopIndex = function (stops) {
          var nearestStop = 0;
          var nearestDistance = Infinity;

          stops.forEach(function (stop, stopIndex) {
            var distance = Math.abs(stop - currentIndex);

            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestStop = stopIndex;
            }
          });

          return nearestStop;
        };

        var updateButtons = function () {
          var maxIndex = getMaxIndex();
          var isScrollable = track.scrollWidth - track.clientWidth > 1 && maxIndex > 0;
          var atStart = currentIndex <= 0;
          var atEnd = currentIndex >= maxIndex;

          previousButton.disabled = !isScrollable || atStart;
          nextButton.disabled = !isScrollable || atEnd;
          previousButton.setAttribute('aria-disabled', previousButton.disabled ? 'true' : 'false');
          nextButton.setAttribute('aria-disabled', nextButton.disabled ? 'true' : 'false');
        };

        var syncIndexFromScroll = function () {
          currentIndex = Math.min(
            getMaxIndex(),
            Math.max(0, Math.round(track.scrollLeft / getStep()))
          );
        };

        var queueUpdate = function () {
          window.cancelAnimationFrame(scrollFrame);
          scrollFrame = window.requestAnimationFrame(function () {
            syncIndexFromScroll();
            updateButtons();
          });
        };

        var changePage = function (direction) {
          var stops = getPageStops();
          var stopIndex = getCurrentStopIndex(stops);
          var targetStopIndex = Math.min(
            stops.length - 1,
            Math.max(0, stopIndex + direction)
          );

          currentIndex = stops[targetStopIndex];
          track.scrollTo({
            left: getScrollTarget(currentIndex),
            behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
          });
          updateButtons();
        };

        previousButton.addEventListener('click', function () {
          changePage(-1);
        });

        nextButton.addEventListener('click', function () {
          changePage(1);
        });

        track.addEventListener('scroll', queueUpdate, { passive: true });
        window.addEventListener('resize', queueUpdate);
        updateButtons();
      });
    }
  };

})(Drupal, once);
