import lunr from 'lunr';

import prebuiltIndex from './web/js/lunr-index.json';

console.log('prebuiltIndex',prebuiltIndex);

const idx = lunr.Index.load(prebuiltIndex);

const searchResults = idx.search("database");
/*
const resultsWithMetadata = searchResults.map(result => {
  const doc = documents.find(d => d.id === result.ref);
  return {
    id: doc._id,
    title: doc.title,
    author: doc.content,  // Extra metadata
    
  };
});
*/
console.log(searchResults);