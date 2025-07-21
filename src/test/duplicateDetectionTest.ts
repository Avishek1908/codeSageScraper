import * as fs from 'fs-extra';
import * as path from 'path';

// Simple script to demonstrate duplicate detection on comments
async function testDuplicateDetection() {
  console.log('🧪 Testing duplicate comment detection...');
  
  // Sample comments that include duplicates (simulating the issue you found)
  const rawComments = [
    'freeNeasySep 24, 2018My first leetcode,keep going.Read more5KShow 134 RepliesReply',
    'freeNeasySep 24, 2018My first leetcode,keep going.Read more5KShow 134 RepliesReply', // Duplicate
    'Yu-Chia LiuNov 06, 2018python3 class Solution: def twoSum...Read more1.9KShow 90 RepliesReply',
    'AlgoMaster Jan 15, 2019 Clean C++ implementation. 850 votes',
    'Yu-Chia LiuNov 06, 2018python3 class Solution: def twoSum...Read more1.9KShow 90 RepliesReply', // Duplicate
    'CodeNinja Feb 12, 2020 Great explanation! 600 votes'
  ];
  
  console.log(`📊 Input: ${rawComments.length} raw comments (including duplicates)`);
  
  // Apply duplicate detection logic
  const comments: Record<string, string> = {};
  const seenComments = new Set<string>();
  let commentCount = 0;
  
  rawComments.forEach((text, index) => {
    // Create a normalized version for duplicate detection
    const normalizedText = text.toLowerCase()
      .replace(/read more/g, '')
      .replace(/show \d+ replies/g, '')
      .replace(/reply/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Use first 50 characters as fingerprint to detect duplicates
    const fingerprint = normalizedText.substring(0, 50);
    
    console.log(`\n🔍 Processing comment ${index + 1}:`);
    console.log(`   Original: ${text.substring(0, 80)}...`);
    console.log(`   Fingerprint: ${fingerprint}`);
    
    if (!seenComments.has(fingerprint)) {
      seenComments.add(fingerprint);
      commentCount++;
      comments[`comment${commentCount}`] = text;
      console.log(`   ✅ Added as comment${commentCount} (unique)`);
    } else {
      console.log(`   ❌ Skipped (duplicate detected)`);
    }
  });
  
  console.log(`\n📊 Results:`);
  console.log(`   Input comments: ${rawComments.length}`);
  console.log(`   Unique comments: ${Object.keys(comments).length}`);
  console.log(`   Duplicates removed: ${rawComments.length - Object.keys(comments).length}`);
  
  // Save the results
  const outputData = {
    question: 'Two Sum - Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    solution: {
      approaches: [
        {
          title: 'Brute Force',
          complexity: { time: 'O(n²)', space: 'O(1)' },
          description: 'Check every possible pair of numbers in the array',
          implementation: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        for (int i = 0; i < nums.size(); i++) {
            for (int j = i + 1; j < nums.size(); j++) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {};
    }
};`
        },
        {
          title: 'Two-pass Hash Table',
          complexity: { time: 'O(n)', space: 'O(n)' },
          description: 'Use hash table to store values and indices, then check for complements',
          implementation: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            map[nums[i]] = i;
        }
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.count(complement) && map[complement] != i) {
                return {i, map[complement]};
            }
        }
        return {};
    }
};`
        },
        {
          title: 'One-pass Hash Table',
          complexity: { time: 'O(n)', space: 'O(n)' },
          description: 'Build hash table and check for complement simultaneously',
          implementation: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.count(complement)) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`
        }
      ]
    },
    topComments: comments
  };
  
  // Save to file
  const outputPath = path.join(process.cwd(), 'data', 'duplicate_detection_test.json');
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeJson(outputPath, outputData, { spaces: 2 });
  
  console.log(`\n💾 Results saved to: ${outputPath}`);
  console.log(`\n🎉 Duplicate detection test completed!`);
  console.log(`\n📋 Final topComments:`);
  Object.keys(comments).forEach((key, index) => {
    const preview = comments[key].substring(0, 100);
    console.log(`   ${index + 1}. ${key}: ${preview}...`);
  });
}

// Run the test
if (require.main === module) {
  testDuplicateDetection().catch(console.error);
}
