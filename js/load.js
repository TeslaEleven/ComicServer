import $ from 'jquery';

// Default config
const DEFAULTS = {
    url: null,
    beforeReload: null,
    onReloaded: null,
    onError: null,
};

// Log message
const log = (...args) => {
    if (window.console && typeof console.log === 'function' && window.__JQUERY_RELOAD_DEBUG) {
        console.log.apply(console, args);
    }
};

$.fn.reload = function (config) {
    let elements = $(this);
    let options = $.extend({}, DEFAULTS, config);

    let reloadUrl = options.url || (location.pathname + location.search);
    log(`[jquery.reload] INFO :: Reload url: "${reloadUrl}"`);

    typeof options.beforeReload === 'function' && options.beforeReload.call(elements, options);
    elements.trigger('reload:before', options);

    $.ajax({
        type: 'GET',
        url: reloadUrl,
        success: (resp) => {
            let fragment = $('<div />').html(resp);
            elements.each(function () {
                let element = $(this);
                let elementId = element.attr('id');

                if (elementId) {
                    this.innerHTML = fragment.find(`#${elementId}`).html();
                } else {
                    log(`[jquery.reload] WARN :: element has not ID attribute`);
                }
            });

            typeof options.onReloaded === 'function' && options.onReloaded(elements, fragment, options);
            elements.trigger('reload:reloaded', fragment, options);
        },
        error: (jqXHR) => {
            typeof options.onError === 'function' && options.onError(elements, jqXHR, options);
            elements.trigger('reload:error', jqXHR, options);
        },
    });

    return elements;
};

// Version
$.fn.reload.version = '@{version}';
