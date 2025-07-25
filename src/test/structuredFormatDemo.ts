import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../utils/logger';

/**
 * Demo script that shows how the StructuredEditorialScraper would format data
 * This creates a mock output in the same format as complete_two_sum_editorial.json
 */
async function createStructuredFormatDemo() {
    const logger = new Logger();
    
    try {
        logger.info('🎨 Creating Structured Editorial Format Demo');

        // Mock data in the structured format like complete_two_sum_editorial.json
        const structuredOutput = {
            question: "Two Sum",
            solution: {
                problemId: "two-sum",
                title: "Complete Editorial Solution: Two Sum",
                extractedAt: new Date().toISOString(),
                sourceUrl: "https://leetcode.com/problems/two-sum/editorial/",
                videoSolution: {
                    found: true,
                    description: "Video Solution",
                    iframeUrl: "https://player.vimeo.com/video/567281997"
                },
                approaches: [
                    {
                        title: "Approach 1: Brute Force",
                        algorithm: "Algorithm",
                        implementation: "Implementation",
                        complexityAnalysis: "Complexity Analysis",
                        codeBlocks: [],
                        iframeUrl: "",
                        fullContent: "Algorithm\n\nThe brute force approach is simple. Loop through each element x and find if there is another value that equals to target−x.\n\nImplementation\n\nComplexity Analysis\n\nTime complexity: O(n²).\nFor each element, we try to find its complement by looping through the rest of the array which takes O(n) time. Therefore, the time complexity is O(n²).\n\nSpace complexity: O(1).\nThe space required does not depend on the size of the input array, so only constant space is used."
                    },
                    {
                        title: "Approach 2: Two-pass Hash Table",
                        algorithm: "Algorithm",
                        implementation: "A simple implementation uses two iterations. In the first iteration, we add each element's value as a key and its index as a value to the hash table. Then, in the second iteration, we check if each element's complement (target−nums[i]) exists in the hash table. If it does exist, we return current element's index and its complement's index. Beware that the complement must not be nums[i] itself!",
                        complexityAnalysis: "To improve our runtime complexity, we need a more efficient way to check if the complement exists in the array. If the complement exists, we need to get its index. What is the best way to maintain a mapping of each element in the array to its index? A hash table.",
                        codeBlocks: [],
                        iframeUrl: "",
                        fullContent: "Intuition\n\nTo improve our runtime complexity, we need a more efficient way to check if the complement exists in the array. If the complement exists, we need to get its index. What is the best way to maintain a mapping of each element in the array to its index? A hash table.\n\nWe can reduce the lookup time from O(n) to O(1) by trading space for speed. A hash table is well suited for this purpose because it supports fast lookup in near constant time. I say \"near\" because if a collision occurred, a lookup could degenerate to O(n) time. However, lookup in a hash table should be amortized O(1) time as long as the hash function was chosen carefully.\n\nAlgorithm\n\nA simple implementation uses two iterations. In the first iteration, we add each element's value as a key and its index as a value to the hash table. Then, in the second iteration, we check if each element's complement (target−nums[i]) exists in the hash table. If it does exist, we return current element's index and its complement's index. Beware that the complement must not be nums[i] itself!\n\nImplementation\n\nComplexity Analysis\n\nTime complexity: O(n).\nWe traverse the list containing n elements exactly twice. Since the hash table reduces the lookup time to O(1), the overall time complexity is O(n).\n\nSpace complexity: O(n).\nThe extra space required depends on the number of items stored in the hash table, which stores exactly n elements."
                    },
                    {
                        title: "Approach 3: One-pass Hash Table",
                        algorithm: "Algorithm",
                        implementation: "Implementation",
                        complexityAnalysis: "Complexity Analysis",
                        codeBlocks: [],
                        iframeUrl: "",
                        fullContent: "Algorithm\n\nIt turns out we can do it in one-pass. While we are iterating and inserting elements into the hash table, we also look back to check if current element's complement already exists in the hash table. If it exists, we have found a solution and return the indices immediately.\n\nImplementation\n\nComplexity Analysis\n\nTime complexity: O(n).\nWe traverse the list containing n elements only once. Each lookup in the table costs only O(1) time.\n\nSpace complexity: O(n).\nThe extra space required depends on the number of items stored in the hash table, which stores at most n elements."
                    }
                ],
                iframeImplementations: [
                    {
                        src: "https://leetcode.com/playground/WTVGRyeD/shared",
                        id: "iframe-1",
                        content: "class Solution {\npublic:\n    vector<int> twoSum(vector<int> &nums, int target) {\n        for (int i = 0; i < nums.size(); i++) {\n            for (int j = i + 1; j < nums.size(); j++) {\n                if (nums[j] == target - nums[i]) {\n                    return {i, j};\n                }\n            }\n        }\n        // Return an empty vector if no solution is found\n        return {};\n    }\n};"
                    },
                    {
                        src: "https://leetcode.com/playground/bbEpXJcf/shared",
                        id: "iframe-2",
                        content: "class Solution {\npublic:\n    vector<int> twoSum(vector<int> &nums, int target) {\n        unordered_map<int, int> hash;\n        for (int i = 0; i < nums.size(); i++) {\n            hash[nums[i]] = i;\n        }\n        for (int i = 0; i < nums.size(); i++) {\n            int complement = target - nums[i];\n            if (hash.find(complement) != hash.end() && hash[complement] != i) {\n                return {i, hash[complement]};\n            }\n        }\n        // If no valid pair is found, return an empty vector\n        return {};\n    }\n};"
                    },
                    {
                        src: "https://leetcode.com/playground/4KK3DMtw/shared",
                        id: "iframe-3",
                        content: "class Solution {\npublic:\n    vector<int> twoSum(vector<int> &nums, int target) {\n        unordered_map<int, int> hash;\n        for (int i = 0; i < nums.size(); ++i) {\n            int complement = target - nums[i];\n            if (hash.find(complement) != hash.end()) {\n                return {hash[complement], i};\n            }\n            hash[nums[i]] = i;\n        }\n        // Return an empty vector if no solution is found\n        return {};\n    }\n};"
                    }
                ],
                topComments: {
                    comment1: "My first leetcode, keep going! This is a great starting problem.",
                    comment2: "JavaScript solution using hash map for O(n) time complexity",
                    comment3: "Python implementation with clean code and good performance",
                    comment4: "class Solution:\n    def twoSum(self, nums, target):\n        h = {}\n        for i, num in enumerate(nums):\n            n = target - num\n            if n not in h:\n                h[num] = i\n            else:\n                return [h[n], i]",
                    comment5: "Java solution with Hashtable - 99.94% faster than all submissions"
                },
                summary: {
                    totalApproaches: 3,
                    totalImplementations: 3,
                    hasVideoSolution: true,
                    contentLength: 1245,
                    totalComments: 5
                },
                debugInfo: {
                    totalHeadings: 6,
                    totalIframes: 4,
                    contentSections: [
                        "P: Algorithm...",
                        "P: The brute force approach is simple...",
                        "P: Implementation...",
                        "P: Complexity Analysis...",
                        "UL: Time complexity: O(n²)...",
                        "P: Intuition...",
                        "P: To improve our runtime complexity...",
                        "P: Algorithm...",
                        "P: A simple implementation uses two iterations...",
                        "P: Implementation...",
                        "P: Complexity Analysis...",
                        "UL: Time complexity: O(n)...",
                        "P: Algorithm...",
                        "P: It turns out we can do it in one-pass...",
                        "P: Implementation...",
                        "P: Complexity Analysis...",
                        "UL: Time complexity: O(n)..."
                    ],
                    stoppedAt: "Content extraction completed successfully"
                }
            }
        };

        // Export the structured format
        const outputPath = path.join('data', 'structured_format_demo.json');
        await fs.writeJSON(outputPath, structuredOutput, { spaces: 2 });

        logger.info(`✅ Structured format demo created: ${outputPath}`);

        // Display the format structure
        console.log('\n🎯 Structured Editorial Format:');
        console.log('├── question: String');
        console.log('└── solution:');
        console.log('    ├── problemId: String');
        console.log('    ├── title: String');
        console.log('    ├── extractedAt: ISO Date');
        console.log('    ├── sourceUrl: String');
        console.log('    ├── videoSolution:');
        console.log('    │   ├── found: Boolean');
        console.log('    │   ├── description: String');
        console.log('    │   └── iframeUrl: String');
        console.log('    ├── approaches: Array<Approach>');
        console.log('    │   ├── title: String');
        console.log('    │   ├── algorithm: String');
        console.log('    │   ├── implementation: String');
        console.log('    │   ├── complexityAnalysis: String');
        console.log('    │   ├── codeBlocks: Array<String>');
        console.log('    │   ├── iframeUrl: String');
        console.log('    │   └── fullContent: String');
        console.log('    ├── iframeImplementations: Array<Implementation>');
        console.log('    │   ├── src: String');
        console.log('    │   ├── id: String');
        console.log('    │   └── content: String');
        console.log('    ├── topComments: Object<String, String>');
        console.log('    ├── summary:');
        console.log('    │   ├── totalApproaches: Number');
        console.log('    │   ├── totalImplementations: Number');
        console.log('    │   ├── hasVideoSolution: Boolean');
        console.log('    │   ├── contentLength: Number');
        console.log('    │   └── totalComments: Number');
        console.log('    └── debugInfo: Object');

        console.log('\n📊 Sample Data Summary:');
        console.log(`   - Problem: ${structuredOutput.solution.title}`);
        console.log(`   - Approaches: ${structuredOutput.solution.summary.totalApproaches}`);
        console.log(`   - Code Implementations: ${structuredOutput.solution.summary.totalImplementations}`);
        console.log(`   - Comments: ${structuredOutput.solution.summary.totalComments}`);
        console.log(`   - Video Solution: ${structuredOutput.solution.summary.hasVideoSolution ? 'Yes' : 'No'}`);
        console.log(`   - Content Length: ${structuredOutput.solution.summary.contentLength} chars`);

        console.log('\n💡 This format matches exactly what your complete_two_sum_editorial.json file contains!');
        
    } catch (error) {
        logger.error(`❌ Demo creation failed: ${error}`);
        throw error;
    }
}

// Run the demo if this file is executed directly
if (require.main === module) {
    createStructuredFormatDemo()
        .then(() => {
            console.log('\n🎉 Structured format demo completed successfully!');
            console.log('   Check data/structured_format_demo.json to see the format.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Demo failed:', error);
            process.exit(1);
        });
}

export { createStructuredFormatDemo };
