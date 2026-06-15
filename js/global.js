/**
 * @file
 * Global utilities.
 *
 */
(function (Drupal, once) {

  'use strict';

  Drupal.behaviors.cesascTheme = {
    attach: function (context, settings) {

    }
  };

  Drupal.behaviors.cesascUpcomingEvents = {
    attach: function (context) {
      once('cesasc-upcoming-events-carousel', '.js-upcoming-events-carousel', context).forEach(function (carousel, carouselIndex) {
        var track = carousel.querySelector('.view-content');
        var previousButton = carousel.querySelector('[data-upcoming-events-prev]');
        var nextButton = carousel.querySelector('[data-upcoming-events-next]');

        if (!track || !previousButton || !nextButton) {
          if (previousButton) {
            previousButton.hidden = true;
          }

          if (nextButton) {
            nextButton.hidden = true;
          }

          return;
        }

        var cards = Array.prototype.filter.call(track.children, function (child) {
          return child.classList.contains('views-row');
        });

        if (!cards.length) {
          previousButton.hidden = true;
          nextButton.hidden = true;
          return;
        }

        track.classList.add('upcoming-events-block__track');
        track.setAttribute('tabindex', '0');

        if (!track.id) {
          track.id = 'upcoming-events-track-' + carouselIndex;
        }

        previousButton.setAttribute('aria-controls', track.id);
        nextButton.setAttribute('aria-controls', track.id);

        cards.forEach(addDateBadge);

        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        var scrollFrame;

        var getScrollAmount = function () {
          return Math.max(track.clientWidth, cards[0].getBoundingClientRect().width);
        };

        var updateButtons = function () {
          var maxScroll = track.scrollWidth - track.clientWidth;
          var atStart = track.scrollLeft <= 1;
          var atEnd = track.scrollLeft >= maxScroll - 1;

          previousButton.disabled = atStart;
          nextButton.disabled = atEnd || maxScroll <= 1;
          previousButton.setAttribute('aria-disabled', atStart ? 'true' : 'false');
          nextButton.setAttribute('aria-disabled', atEnd || maxScroll <= 1 ? 'true' : 'false');
        };

        var queueUpdate = function () {
          window.cancelAnimationFrame(scrollFrame);
          scrollFrame = window.requestAnimationFrame(updateButtons);
        };

        var slide = function (direction) {
          track.scrollBy({
            left: direction * getScrollAmount(),
            behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
          });
        };

        previousButton.addEventListener('click', function () {
          slide(-1);
        });

        nextButton.addEventListener('click', function () {
          slide(1);
        });

        track.addEventListener('scroll', queueUpdate, { passive: true });
        window.addEventListener('resize', queueUpdate);
        updateButtons();
      });
    }
  };

  function addDateBadge(card) {
    if (card.querySelector('.upcoming-events-card__date-badge')) {
      return;
    }

    var dateText = getFieldText(card, [
      '.views-field-field-display-date',
      '.views-field-field-event-date',
      '.views-field-field-date',
      '.views-field-field-start-date',
      '.views-field-created',
      'time'
    ]);
    var dateParts = parseDateParts(dateText);

    if (!dateParts) {
      return;
    }

    var badge = document.createElement('span');
    badge.className = 'upcoming-events-card__date-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = '<span class="upcoming-events-card__date-month">' + dateParts.month + '</span><span class="upcoming-events-card__date-day">' + dateParts.day + '</span>';
    card.insertBefore(badge, card.firstChild);
  }

  function getFieldText(card, selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var field = card.querySelector(selectors[i]);

      if (field) {
        var content = field.querySelector('.field-content') || field;
        var text = content.textContent.replace(/\s+/g, ' ').trim();

        if (text) {
          return text;
        }
      }
    }

    return '';
  }

  function parseDateParts(text) {
    if (!text) {
      return null;
    }

    var months = {
      jan: 'Jan',
      january: 'Jan',
      feb: 'Feb',
      february: 'Feb',
      mar: 'Mar',
      march: 'Mar',
      apr: 'Apr',
      april: 'Apr',
      may: 'May',
      jun: 'Jun',
      june: 'Jun',
      jul: 'Jul',
      july: 'Jul',
      aug: 'Aug',
      august: 'Aug',
      sep: 'Sep',
      sept: 'Sep',
      september: 'Sep',
      oct: 'Oct',
      october: 'Oct',
      nov: 'Nov',
      november: 'Nov',
      dec: 'Dec',
      december: 'Dec'
    };
    var monthNames = Object.keys(months).join('|');
    var monthFirst = new RegExp('\\b(' + monthNames + ')\\.?\\s+(\\d{1,2})\\b', 'i');
    var dayFirst = new RegExp('\\b(\\d{1,2})\\s+(' + monthNames + ')\\.?\\b', 'i');
    var numericDate = /\b(\d{1,2})[/.=-](\d{1,2})[/.=-](?:\d{2,4})?\b/;
    var match = text.match(monthFirst);

    if (match) {
      return {
        month: months[match[1].toLowerCase().replace('.', '')],
        day: match[2]
      };
    }

    match = text.match(dayFirst);

    if (match) {
      return {
        month: months[match[2].toLowerCase().replace('.', '')],
        day: match[1]
      };
    }

    match = text.match(numericDate);

    if (match) {
      var monthIndex = parseInt(match[1], 10) - 1;
      var monthName = new Date(2020, monthIndex, 1).toLocaleString('en-US', { month: 'short' });

      return {
        month: monthName,
        day: match[2]
      };
    }

    return null;
  }

})(Drupal, once);
