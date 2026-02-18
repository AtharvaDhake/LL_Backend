const http = require('http');

const makeRequest = (path) => {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:9000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.log("Raw Response for " + path + ":", data.substring(0, 100)); 
          resolve(data); 
        }
      });
    }).on('error', reject);
  });
};

const runTests = async () => {
    try {
        console.log("--- Starting Comprehensive API Tests ---");

        // 1. Pagination
        console.log("\n1. Testing Pagination (limit=5)...");
        const pagination = await makeRequest('/api/products?limit=5');
        console.log(`Returned: ${pagination.products?.length} products. Total: ${pagination.totalCount}.`);
        if(pagination.products?.length === 5) console.log("PASS: Pagination Size");
        else console.log("FAIL: Pagination Size");

        // 2. Filter by Skill
        console.log("\n2. Testing Filter by Skill (Cognitive Development)...");
        const skill = await makeRequest('/api/products?skill=Cognitive Development');
        const skillMatch = skill.products?.every(p => p.skills.includes("Cognitive Development"));
        console.log(`Returned: ${skill.products?.length} products.`);
        if(skillMatch && skill.products?.length > 0) console.log("PASS: Skill Filter");
        else console.log("FAIL: Skill Filter");

        // 3. Filter by Age (Special Characters)
        console.log("\n3. Testing Filter by Age (Toddlers (2-4))...");
        const age = await makeRequest('/api/products?age=Toddlers%20(2-4)');
        const ageMatch = age.products?.every(p => p.ages.some(a => a.includes("Toddlers")));
        console.log(`Returned: ${age.products?.length} products.`);
        if(ageMatch && age.products?.length > 0) console.log("PASS: Age Filter (Regex Escaping)");
        else console.log("FAIL: Age Filter");

        // 4. Filter by Activity
        console.log("\n4. Testing Filter by Activity (Sorting & Placing)...");
        const activity = await makeRequest('/api/products?activity=Sorting%20%26%20Placing');
        const actMatch = activity.products?.every(p => p.activities.includes("Sorting & Placing"));
        console.log(`Returned: ${activity.products?.length} products.`);
        if(actMatch && activity.products?.length > 0) console.log("PASS: Activity Filter");
        else console.log("FAIL: Activity Filter");

        // 5. Combine Filters
        console.log("\n5. Testing Combined Filters (Skill + Age)...");
        const combined = await makeRequest('/api/products?skill=Cognitive%20Development&age=Toddlers%20(2-4)');
        const combinedMatch = combined.products?.every(p => 
            p.skills.includes("Cognitive Development") && 
            p.ages.some(a => a.includes("Toddlers"))
        );
        console.log(`Returned: ${combined.products?.length} products.`);
        if(combinedMatch && combined.products?.length > 0) console.log("PASS: Combined Filters");
        else console.log("FAIL: Combined Filters");

        // 6. Search
        console.log("\n6. Testing Search (Query: 'Fruit')...");
        const search = await makeRequest('/api/products?search=Fruit');
        const searchMatch = search.products?.every(p => 
            p.name.toLowerCase().includes("fruit") || 
            p.description.toLowerCase().includes("fruit")
        );
        console.log(`Returned: ${search.products?.length} products.`);
        if(searchMatch && search.products?.length > 0) console.log("PASS: Search");
        else console.log("FAIL: Search");

        // 7. Sorting (Price Ascending)
        console.log("\n7. Testing Sorting (Price: Low to High)...");
        const sorted = await makeRequest('/api/products?sort=price_asc&limit=10');
        const prices = sorted.products?.map(p => p.price);
        const isSorted = prices?.every((val, i, arr) => !i || (val >= arr[i - 1]));
        console.log(`Prices (first 5): ${prices.slice(0, 5).join(', ')}...`);
        if(isSorted) console.log("PASS: Price Sorting");
        else console.log("FAIL: Price Sorting");

        console.log("\n--- All Tests Completed ---");
    } catch (error) {
        console.error("Test Failed:", error.message);
    }
};

runTests();
