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

        cards.forEach(function (card) {
          addDateBadge(card);
          formatDatetimeField(card);
        });

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

        var getScrollTarget = function (index) {
          return cards[index].offsetLeft - cards[0].offsetLeft;
        };

        var updateButtons = function () {
          var maxScroll = track.scrollWidth - track.clientWidth;
          var maxIndex = getMaxIndex();
          var isScrollable = maxScroll > 1 && maxIndex > 0;
          var atStart = currentIndex <= 0;
          var atEnd = currentIndex >= maxIndex;

          track.classList.toggle('is-not-scrollable', !isScrollable);
          previousButton.disabled = atStart || !isScrollable;
          nextButton.disabled = atEnd || !isScrollable;
          previousButton.classList.toggle('is-unavailable', atStart || !isScrollable);
          previousButton.setAttribute('aria-disabled', atStart ? 'true' : 'false');
          nextButton.setAttribute('aria-disabled', atEnd || !isScrollable ? 'true' : 'false');
        };

        var syncIndexFromScroll = function () {
          currentIndex = Math.min(getMaxIndex(), Math.max(0, Math.round(track.scrollLeft / getStep())));
        };

        var queueUpdate = function () {
          window.cancelAnimationFrame(scrollFrame);
          scrollFrame = window.requestAnimationFrame(function () {
            syncIndexFromScroll();
            updateButtons();
          });
        };

        var slide = function (direction) {
          currentIndex = Math.min(getMaxIndex(), Math.max(0, currentIndex + direction));

          track.scrollTo({
            left: getScrollTarget(currentIndex),
            behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
          });
          updateButtons();
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

  function formatDatetimeField(card) {
    var field = card.querySelector('.views-field-field-event-date');

    if (!field || field.classList.contains('upcoming-events-card__datetime')) {
      return;
    }

    var content = field.querySelector('.field-content') || field;
    var timeElement = content.querySelector('time');
    var rawValue = timeElement ? timeElement.getAttribute('datetime') : content.textContent;
    var normalizedValue = (rawValue || '').replace(/\s+/g, ' ').trim();

    if (!normalizedValue) {
      field.classList.add('is-empty');
      return;
    }

    var date = parseEventDate(normalizedValue);

    if (!date) {
      return;
    }

    var formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
    var formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
    var wrapper = document.createElement('time');

    wrapper.className = 'upcoming-events-card__datetime-value';
    wrapper.setAttribute('datetime', normalizedValue);
    wrapper.appendChild(buildDatetimeLine('date', formattedDate));
    wrapper.appendChild(buildDatetimeLine('time', formattedTime));

    content.textContent = '';
    content.appendChild(wrapper);
    field.classList.add('upcoming-events-card__datetime');
  }

  function buildDatetimeLine(type, text) {
    var line = document.createElement('span');
    var icon = document.createElement('span');
    var value = document.createElement('span');

    line.className = 'upcoming-events-card__datetime-line upcoming-events-card__datetime-line--' + type;
    icon.className = 'upcoming-events-card__datetime-icon upcoming-events-card__datetime-icon--' + type;
    icon.setAttribute('aria-hidden', 'true');
    value.className = 'upcoming-events-card__datetime-text';
    value.textContent = text;

    line.appendChild(icon);
    line.appendChild(value);

    return line;
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

  function parseEventDate(text) {
    var date = new Date(text);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }

    var dateTimeMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2}):(\d{2})\b/);

    if (dateTimeMatch) {
      date = new Date(
        parseInt(dateTimeMatch[3], 10),
        parseInt(dateTimeMatch[1], 10) - 1,
        parseInt(dateTimeMatch[2], 10),
        parseInt(dateTimeMatch[4], 10),
        parseInt(dateTimeMatch[5], 10)
      );

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
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
