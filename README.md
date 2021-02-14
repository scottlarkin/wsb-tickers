Prototype / proof of concept. Written quickly, not much attention paid to best practices or efficiency   


Every 10 minutes, searches through the top 100 posts of /r/wallstreetbets and counts instances of stock tickers in the comments  

Displays results in a graph at localhost:3000 (port can be changed in source code)  

Requires: 
``` 
nodejs  
npm  
mongodb locally on default port (connection string can be changed in source code)
```

Will fully use 12 CPU threads every 10 minutes. Can be changed in the source code here : https://github.com/scottlarkin/wsb-tickers/blob/main/src/back_end/main/index.ts#L156 (12 being the number of CPUs to use)

Running instructions:  
```
Ensure mongodb is running  
npm i  
npm run start  
```