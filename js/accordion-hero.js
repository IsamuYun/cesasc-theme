(function (Drupal, once) {
  Drupal.behaviors.accordionHero = {
    attach(context) {
      once('accordionHero', '.js-accordion-hero', context).forEach((hero) => {
        const items = Array.from(hero.querySelectorAll('.accordion-hero__item'));

        const setActive = (activeItem) => {
          items.forEach((item) => {
            const isActive = item === activeItem;
            const panel = item.querySelector('.accordion-hero__panel');

            item.classList.toggle('is-active', isActive);
            item.querySelector('.accordion-hero__trigger')?.setAttribute('aria-expanded', String(isActive));

            if (panel) {
              panel.setAttribute('aria-hidden', String(!isActive));
              panel.toggleAttribute('inert', !isActive);
            }
          });
        };

        items.forEach((item, index) => {
          const trigger = item.querySelector('.accordion-hero__trigger');

          item.addEventListener('pointerenter', (event) => {
            if (event.pointerType === 'mouse') {
              setActive(item);
            }
          });

          item.addEventListener('focusin', () => setActive(item));

          trigger?.addEventListener('click', () => setActive(item));

          trigger?.addEventListener('keydown', (event) => {
            const keyMap = {
              ArrowRight: 1,
              ArrowDown: 1,
              ArrowLeft: -1,
              ArrowUp: -1,
            };

            if (!(event.key in keyMap)) {
              return;
            }

            event.preventDefault();
            const nextIndex = (index + keyMap[event.key] + items.length) % items.length;
            const nextTrigger = items[nextIndex].querySelector('.accordion-hero__trigger');
            setActive(items[nextIndex]);
            nextTrigger?.focus();
          });
        });

        const initiallyActive = hero.querySelector('.accordion-hero__item.is-active') || items[0];
        if (initiallyActive) {
          setActive(initiallyActive);
        }
      });
    },
  };
})(Drupal, once);
