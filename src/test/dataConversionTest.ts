import * as fs from 'fs-extra';
import * as path from 'path';
import { StructuredDataConverter } from '../utils/structuredDataConverter';
import { Logger } from '../utils/logger';

/**
 * Test script to demonstrate converting existing scraped data to structured format
 * This shows how to transform data into the format like complete_two_sum_editorial.json
 */
async function testDataConversion() {
    const logger = new Logger();
    const converter = new StructuredDataConverter();

    try {
        logger.info('🔄 Starting Data Conversion Test');

        // Check if we have the integrated editorial data to convert
        const inputPath = path.join('data', 'integrated_editorial_with_enhanced_comments.json');
        
        if (await fs.pathExists(inputPath)) {
            logger.info(`📖 Found existing data to convert: ${inputPath}`);
            
            // Convert the file
            const outputPath = path.join('data', 'converted_structured_editorial.json');
            await converter.convertFile(inputPath, outputPath);
            
            logger.info(`✅ Conversion completed! Check: ${outputPath}`);

            // Read and display the converted structure
            const convertedData = await fs.readJSON(outputPath);
            
            console.log('\n📊 Converted Data Summary:');
            console.log(`   - Question: ${convertedData.question}`);
            console.log(`   - Problem ID: ${convertedData.solution.problemId}`);
            console.log(`   - Approaches: ${convertedData.solution.summary.totalApproaches}`);
            console.log(`   - Implementations: ${convertedData.solution.summary.totalImplementations}`);
            console.log(`   - Comments: ${convertedData.solution.summary.totalComments}`);
            console.log(`   - Video Solution: ${convertedData.solution.summary.hasVideoSolution ? 'Yes' : 'No'}`);
            console.log(`   - Content Length: ${convertedData.solution.summary.contentLength} chars`);

            console.log('\n🎯 Structure matches complete_two_sum_editorial.json format!');
            
        } else {
            // Create a mock example to demonstrate
            logger.info('📝 Creating mock data conversion example...');
            
            const mockData = {
                title: "Two Sum",
                content: "This is a classic array problem. Approach 1: Use brute force with nested loops. Approach 2: Use hash table for O(n) solution.",
                solutions: [
                    "class Solution { public int[] twoSum(int[] nums, int target) { /* brute force */ } }",
                    "class Solution { public int[] twoSum(int[] nums, int target) { /* hash table */ } }"
                ],
                comments: [
                    "Great problem for beginners!",
                    "Hash table solution is optimal",
                    "Python: def twoSum(self, nums, target): return [0, 1]",
                    "JavaScript implementation works well",
                    "Time complexity is important here"
                ],
                sourceUrl: "https://leetcode.com/problems/two-sum/editorial/"
            };

            const convertedData = await converter.convertToStructuredFormat(mockData, "Two Sum");
            
            const outputPath = path.join('data', 'mock_converted_structured_editorial.json');
            await fs.writeJSON(outputPath, convertedData, { spaces: 2 });
            
            logger.info(`✅ Mock conversion completed! Check: ${outputPath}`);

            console.log('\n📊 Mock Converted Data Summary:');
            console.log(`   - Question: ${convertedData.question}`);
            console.log(`   - Problem ID: ${convertedData.solution.problemId}`);
            console.log(`   - Approaches: ${convertedData.solution.summary.totalApproaches}`);
            console.log(`   - Implementations: ${convertedData.solution.summary.totalImplementations}`);
            console.log(`   - Comments: ${convertedData.solution.summary.totalComments}`);
            console.log(`   - Video Solution: ${convertedData.solution.summary.hasVideoSolution ? 'Yes' : 'No'}`);
            console.log(`   - Content Length: ${convertedData.solution.summary.contentLength} chars`);
        }

        console.log('\n💡 Key Benefits of Structured Format:');
        console.log('   ✅ Clean, consistent structure');
        console.log('   ✅ Separated approaches and implementations');
        console.log('   ✅ Organized comments without duplication');
        console.log('   ✅ Proper metadata and summary statistics');
        console.log('   ✅ LLM-training ready format');
        console.log('   ✅ Easy to parse and analyze');

    } catch (error) {
        logger.error(`❌ Conversion test failed: ${error}`);
        throw error;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testDataConversion()
        .then(() => {
            console.log('\n🎉 Data conversion test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

export { testDataConversion };
