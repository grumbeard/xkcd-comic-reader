# xkcd Comic Reader
Capstone project for JavaScript module of PowerX Programme

## About
This comic reader is a static page displaying comics from XKCD (xkcd.com).

View the live page here :point_right: https://grumbeard.github.io/xkcd-comic-reader/


## Main Features
1. User can navigate across consecutive batches of comics via the navigation buttons ("Prev", "Next")
2. User can toggle between batch sizes of "1", "3", and "5"
3. User can request a random comic to be shown by clicking "Random" or request for a specific comic by entering its number into the textbox
4. For any comic being displayed, in batch size of > 1, the consecutive comics before and after it will be displayed accordingly on a 'rolling' basis (e.g. if the latest comic is #2000, #2000 is the comic before #1)
5. The title and # of each comic is shown above the comic image, and any available captions are also displayed line by line below the image
6. Alt text is also provided (as given by xkcd.com) to support screen readers
7. 'Loading...' text is displayed when the page is busy fetching comic data from xkcd


## Main Learnings
- Working with asynchronous outputs from a For Loop (through use of Promise.all)
- Designing modules to separate responsibilities and implementing Dependency Inversion to make dependencies between modules explicit
- Applying Function Currying to event handlers
- Displaying loading text


## Screenshots
![image](https://user-images.githubusercontent.com/51464365/131468997-a01bb408-8c0e-4cc1-b6f5-a8a4bdeeed23.png)
