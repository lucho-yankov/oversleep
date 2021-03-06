$(function() {
  init(location.href);

  $(document).pjax(".tabs > a", "#content", {fragment: "#content"});
  $(document).on("pjax:success", function(event, data, status, xhr, options) {
    init(options.url);
  });

  $(window).bind("pageshow orientationchange resize popstate", function() {
    initTabs(location.href);
  });

  $(document).on("click", "button", function(event) {
    $(event.target).blur();
    // firefox os keeps the button in focused state after it is clicked - this will reset it
  });
});

var init = function(url) {
  initTabs(location.href);
  FastClick.attach(document.body);
  initWebViewCookie(location.href);
};

// the tabs should be on the bottom of the screen
var initTabs = function(url) {

  $(".tabs .active").removeClass('active');
  if (url.indexOf("/app.html") > -1) {
    $(".tabs .tab-app").addClass('active');
    initApp();
  } else if (url.indexOf("/stats.html") > -1) {
    $(".tabs .tab-stats").addClass('active');
    initStats();
  } else {
    $(".tabs .tab-add").addClass('active');
    initIndex();
  }

  var footer = $(".button-group");
  var footerHeight = footer.height();
  var footerTop = ($(window).scrollTop() + $(window).height() - footerHeight) + "px";

  if (($("#content").height()+footerHeight) < $(window).height()) {
    footer.css({
      "margin-top": $(window).height() - ($("#content").height() + footerHeight) - 8,
      "margin-bottom": 0
    });
  } else {
    footer.css({
      "margin-top": 10,
      "margin-bottom": 0
    });
  }
};

var initWebViewCookie = function(href) {
  if (href.indexOf("webview=1") > -1) {
    document.cookie = "webview=1";
  }
};

var setCurrentTime = function(text, amount) {
  $(".current-time").text(text);
  $(".current-time").data('amount', amount);
};

var setCurrentDate = function(text, date) {
  $(".current-date").text(text);
  $(".current-date").data('date', date);
};

var updateOvertimeStatementTime = function(total) {
  // put hours and minutes in a div
  if (total >= 0) {
    var hours = parseInt(total / 60);
    var minutes = total % 60;
    if (hours === 0) {
      setCurrentTime(minutes + ' minutes', total);
    } else if (hours === 1 && minutes === 0) {
      setCurrentTime(hours + ' hour', total);
    } else if (hours > 1 && minutes === 0) {
      setCurrentTime(hours + ' hours', total);
    } else if (minutes >= 0) {
      if (minutes < 10) {
        minutes = '0' + minutes;
      }
      setCurrentTime(hours + ':' + minutes + ' hours', total);
    }
  } else {
    setCurrentTime('', 0);
  }

  toggleStatementDelimiter();
};

var updateOvertimeStatementDate = function(date) {
  // put date representation in a div
  if (!date.isValid()) {
    setCurrentDate('', '');
  } else {

    var now = moment();
    var diff = now.diff(date, 'days');
    var dateString = date.format("YYYY-MM-DD");
    if (diff === 0) {
      // today
      setCurrentDate('Today', dateString);
    } else if (diff === 1) {
      // yesterday
      setCurrentDate('Yesterday', dateString);
    } else {
      setCurrentDate(dateString, dateString);
    }
  }
  toggleStatementDelimiter();
};

var toggleStatementDelimiter = function() {
  if ($(".current-time").text() === '' || $(".current-date").text() === '') {
    $(".current-statement-delim").text('');
  } else {
    $(".current-statement-delim").text(', ');
  }
};

var showMessage = function(text) {
  $(".message-text").text(text);
  $(".message").fadeIn('fast').delay(1000).fadeOut('fast');
};

var showError = function(text) {
  $(".error > .message-text").text(text);
  $(".error").fadeIn('fast').delay(5000).fadeOut('fast');
};

var reset = function() {
  setCurrentTime('', 0);
  setCurrentDate('', '');
  toggleStatementDelimiter();
  $('input').val('');

  $(".default-overtime-amount").show('fast');
  $(".custom-overtime-amount").hide('fast');

  $(".default-overtime-date").show('fast');
  $(".custom-overtime-date").hide('fast');
};

var save = function(event) {
  var date = moment($(".current-date").data('date'));
  var minutes = parseInt($(".current-time").data('amount'), 10) || 0;

  if (date.isValid() && minutes >= 0) {
    var userData = getUserData();

    addUserDataEntry(date.format('YYYYMMDD'), minutes, userData);

    $(".reset").trigger('click');

  } else {
    // what?
  }
};

var calculate_time = function(event) {
  var amount = parseInt(event.target.value, 10) || 0;
  var total = 0;
  if (/_minutes$/.test(event.target.name)) {
    total = amount + parseInt($("[name=overtime_hours]").val() || 0, 10) * 60;
  } else if (/_hours$/.test(event.target.name)) {
    total = amount * 60 + parseInt($("[name=overtime_minutes]").val() || 0, 10);
  }

  if (total >= 0) {
    updateOvertimeStatementTime(total);
  } else {
    updateOvertimeStatementTime('');
  }
};

var initIndex = function() {

  // overtime controls
  $(".activate-custom-overtime-amount").on('click', function(event) {
    $(".default-overtime-amount").hide('fast');
    $(".custom-overtime-amount").show('fast');
  });

  $(".activate-custom-overtime-date").on('click', function(event) {
    $(".default-overtime-date").hide('fast');
    $(".custom-overtime-date").show('fast');
  });

  $("[name=overtime_hours], [name=overtime_minutes]").on('change', calculate_time);

  $(".time-amount").on('click', function(event) {
    var amount = (parseInt(event.target.dataset.amount) || 0);
    updateOvertimeStatementTime(amount);
  });

  $("input[name=overtime_date]").on('change blur', function(event) {
    var date = moment(event.target.value);
    updateOvertimeStatementDate(date);
  });

  // the "when" buttons
  $(".today").on('click', function(event) {
    var date = moment();
    updateOvertimeStatementDate(date);
  });

  $(".yesterday").on('click', function(event) {
    var date = moment().subtract('day', 1);
    updateOvertimeStatementDate(date);
  });

  // form buttons
  $(".save").on('click', save);
  $(".reset").on('click', reset);
};

