import { ProblemScraper } from '../scrapers/problemScraper';
import { DatasetExporter } from '../exporters/datasetExporter';

async function quickTest() {
  console.log('🚀 Quick Test: Using fallback data for demonstration');
  
  // Create some sample data to test the export functionality
  const sampleProblems = [
    {
      id: 'two-sum',
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'Easy' as const,
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      tags: ['Array', 'Hash Table'],
      likes: 0,
      dislikes: 0,
      acceptance: 55.9,
      url: 'https://leetcode.com/problems/two-sum/',
      isPremium: false,
      companies: [],
      similarProblems: [],
      hints: [],
      constraints: 'Array length constraints apply',
      examples: [{
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      }],
      scraped_at: new Date()
    },
    {
      id: 'add-two-numbers',
      title: 'Add Two Numbers',
      slug: 'add-two-numbers',
      difficulty: 'Medium' as const,
      description: 'You are given two non-empty linked lists representing two non-negative integers.',
      tags: ['Linked List', 'Math', 'Recursion'],
      likes: 0,
      dislikes: 0,
      acceptance: 46.4,
      url: 'https://leetcode.com/problems/add-two-numbers/',
      isPremium: false,
      companies: [],
      similarProblems: [],
      hints: [],
      constraints: 'Linked list constraints apply',
      examples: [{
        input: 'l1 = [2,4,3], l2 = [5,6,4]',
        output: '[7,0,8]',
        explanation: '342 + 465 = 807.'
      }],
      scraped_at: new Date()
    }
  ];

  const sampleSolutions = [
    {
      problemId: 'two-sum',
      title: 'Hash Map Solution',
      content: `def twoSum(self, nums: List[int], target: int) -> List[int]:
    hashmap = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in hashmap:
            return [hashmap[complement], i]
        hashmap[num] = i`,
      language: 'python',
      runtime: '52ms',
      memory: '15.2MB',
      author: 'LeetCode',
      votes: 1000,
      approach: 'Hash Table',
      complexity: {
        time: 'O(n)',
        space: 'O(n)'
      },
      explanation: 'Use a hash map to store seen numbers and their indices.',
      url: 'https://leetcode.com/problems/two-sum/solutions/',
      scraped_at: new Date()
    }
  ];

  try {
    const exporter = new DatasetExporter();
    
    console.log('📊 Exporting sample dataset...');
    
    await exporter.exportDataset({
      problems: sampleProblems,
      solutions: sampleSolutions,
      comments: []
    }, {
      format: 'json',
      fileName: 'sample_dataset'
    });
    
    console.log('🤖 Creating LLM training format...');
    await exporter.exportForLLMTraining({
      problems: sampleProblems,
      solutions: sampleSolutions,
      comments: []
    });
    
    console.log('✅ Quick test completed successfully!');
    console.log('📁 Check the ./data folder for exported files');
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
}

if (require.main === module) {
  quickTest();
}
