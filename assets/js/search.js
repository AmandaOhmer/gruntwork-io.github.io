/**
 * Javascript specially for the search bad and filters used in the
 * IaC Library page and the deployment guides page.
 */
(function () {

  function initialEntry() {
    $('#no-matches').hide();
    $('#no-azure-results').hide();
    // Select AWS cloud by default on page load
    selectCloud($('.cloud-filter #aws'));
  }

  // Initial entry on load
  $(initialEntry);

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  // Ensures a given task doesn't fire so often that it bricks browser performance.
  // From: https://davidwalsh.name/javascript-debounce-function
  function debounce(func, wait, immediate) {
    let timeout;
    return function () {
      let context = this,
        args = arguments;
      let later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      let callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  /**
   * Function displays the total items displayed on the page
   */
  function showItemsCount(searchEntry, totalCount, numSubmodules) {
    if (searchEntry.type === 'libraryEntries') {
      $('#search-results-count').show();
      if (totalCount > 0 && numSubmodules > 0) {
        $('#search-results-count').html("<strong>" + totalCount + "</strong> repos (~<strong>" + numSubmodules + "</strong> modules)");
      } else {
        $('#search-results-count').text("0 repos");
      }
    } else {
      if (totalCount > 0 ) {
        $('#search-results-count').html("<strong>" + totalCount + "</strong> post(s) found");
      }
    }
  }

  /**
   * Function to display all items on the page
   */
  function showAllItems() {
    $('.guide-card').show();
    $('.category-head').show();
    $('.categories ul li').show();
  }

  /**
   * Function that counts how many items are on the page
   */
  function showInitialItemsCount(searchEntry) {
    let numSubmodules = 0;
    for (let i = 0; i < searchEntry.entries.length; i++) {
      numSubmodules += libraryEntries[i].num_submodules;
    }
    showItemsCount(searchEntry, searchEntry.entries.length, numSubmodules);
  }

  /**
   * Function that where the search is being performed from
   */
  function detectSearchEntry() {
    let entries = [];
    if (window.libraryEntries) {

      entries = window.libraryEntries;
      return {
        entries,
        type: 'libraryEntries'
      };

    } else if (window.guideEntries) {

      entries = window.guideEntries;
      return {
        entries,
        type: 'guideEntries'
      };
    }
  }


  /**
   * A function to display or hide the category of search
   * @type {Function}
   */
  function displayCategory(entry) {
    let categoryArr = $.merge($('.category-head'), $('.categories ul li'));
    categoryArr.each(function () {
      let category = $(this).text().toLowerCase();
      if (entry.category === category) {
        $(`.categories ul .${category}`).show();
        $(`#${category}.category-head`).show();
      }
    });
  }


  /**
   * A function to search the IaC Lib and Deployment guides. Can also be used for other pages that need it.
   * To show/hide the proper elements based on the results.
   * @type {Function}
   */
  function filterData(searchValue, type) {
    const searchEntry = detectSearchEntry();

    $('#guide-listings').show();

    $('#no-azure-results').hide();
    $('#no-matches').hide();

    if (searchValue && searchValue.length > 0) {
      const searchQueries = searchValue.toLowerCase().split(" ");

      if (searchEntry.type === 'libraryEntries') {
        $('.table-clickable-row').hide();
      } else if (searchEntry.type === 'guideEntries') {
        $('#search-results-count').hide();
        $('.guide-card').hide() &&
          $('.category-head').hide() &&
          $('.categories ul li').hide();
      }

      let matches = 0;
      let submoduleMatches = 0;
      let searchContent;

      searchEntry.entries.forEach(entry => {
        let matchesAll = true;

        searchQueries.forEach(searchQuery => {
          switch (true) {
            case searchEntry.type === 'libraryEntries':
              searchContent = entry.text;
              break;
            case searchEntry.type === 'guideEntries' && type === 'wordSearch':
              searchContent = entry.title + entry.category + entry.content + entry.tags;
              break;
            case searchEntry.type === 'guideEntries' && type === 'tagSearch':
              searchContent = entry.tags + entry.cloud;
              break;
            case searchEntry.type === 'guideEntries' && type === 'cloudSearch':
              searchContent = entry.cloud;
              break;
            default:
              "Not Valid"
          }

          if (searchContent.indexOf(searchQuery) < 0) {
            matchesAll = false;
          }
        });

        //Checks if results were found and displays results accordingly
        if (matchesAll) {
          displayCategory(entry);
          $("#" + entry.id).show();
          matches++;
          (searchEntry.type === 'libraryEntries') ? submoduleMatches += entry.num_submodules: submoduleMatches = 0;
          return;
        }
      });


      if (matches === 0) {
        $('#search-results-count').hide();
        $('#no-matches').show();
        return;
      }

      showItemsCount(searchEntry, matches, submoduleMatches);
    } else {
      if (searchEntry.type === 'libraryEntries') {

        showInitialItemsCount(searchEntry);
        $('.table-clickable-row').show();

      } else if (searchEntry.type === 'guideEntries') {
        showAllItems();
      }
    }
  }

  /**
   * Note
   * This function is wrapped in a "debounce" so that if the user is typing quickly, we aren't trying to run searches
   * (and fire Google Analytics events!) on every key stroke, but only when they pause from typing.
   * @type {Function}
   */
  let searchData = debounce(function (event) {
    let target = $(event.currentTarget);
    let searchValue = target.val();

    filterData(searchValue, 'wordSearch');
  }, 250);


  /* Triggered when filter checkboxes are checked */
  $(document).on('click','.tags', function() {
    filterCloudAndTags();
  });

  function filterCloudAndTags(){
    const checkedTags = $('input[type="checkbox"]:checked');
    const selectedCloud = $('.cloud-filter .active-button').attr("id");

    if (checkedTags.length === 0) {
      // Return filtered to whatever cloud is selected if no tag is checked
      // Or all items if no cloud is selected
      return selectedCloud ? filterData(selectedCloud, 'cloudSearch') : showAllItems();
    }
    checkedTags.each(function() {
      const searchValue = $(this).val();
      filterData(searchValue + (selectedCloud ? ' ' + selectedCloud : ''), 'tagSearch');
    });
  }

  function selectCloud(filterButton) {
    const id = filterButton.attr('id');


    if (filterButton.hasClass('initialSelect') && filterButton.hasClass('active-button') ) {
      filterButton.removeClass('initialSelect');
      filterButton.removeClass('active-button');
      $('#guide-listings').show();
      $('#no-azure-results').hide();
      $('#no-matches').hide();
    } else {
      filterButton.addClass('active-button');
      filterButton.addClass('initialSelect');
      filterButton.siblings().removeClass('active-button');

      if(id === 'azure') {
        $('#guide-listings').hide();
        $('#no-azure-results').show();
        return;
      }
    }

    filterCloudAndTags();
  }

  /* Search box on library page */
  $('#js-search-library').on("keyup", searchData);

  /* Triggered on click of any cloud filtering buttons */
  $('.cloud-filter .filter').click(function () {
    const filterButton = $(this);
    selectCloud(filterButton);
  });


  /* Search box on guides page */
  $('#search-box').on("keyup", searchData);

}());
