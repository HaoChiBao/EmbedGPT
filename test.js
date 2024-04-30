// give me a sample response from the chatGPT model and format it into a markdown format
const test_format_response = "Start ```const test = 'hello'\n```End"

const format_gemini_response = (response) => {}
const format_chatgpt_response = (response) => {
    // format the following response string given by the chatGPT model
    // ChatGPT response formatting
    // 1. Heading
    //     #     Heading 1
    //     ##    Heading 2,
    //     ###   Heading 3,
    //     ####  Heading 4,
    //     ##### Heading 5,

    // 2. Bold text
    //     Enclose the text within double asterisks or double underscores
    //     **text** 
    //     __text__

    // 3. Italic text
    //     Enclose the text with single asterisks or single underscores
    //     *text* 
    //     _text_

    // 4. Strike-through TExt: Enclose the text within double tiles
    //     ~~text~~

    // 5. Monospace text

    // 6. Block-quotes: Begin the line with a greater-than symbol ( > )

    // 7. Ordered Lists starts with numbers followed by periods
    //     1., 2., 3., etc

    // 8. Unordered Lists start lines with:
    //     - Dashes
    //     + Plus signs
    //     * Asterisks

    // 9. Horizontal Rules: for lines by themselves
    //     users ---, ___ or *** 

    // 10. Links formats [link text]
    //     eg. [Google] --> https://www.google.comm

    // 11. Images: Embed images user 
    //     ![alt text](image URL)

    // 12. Code Blocks: triple backticks
    //     ```
    //         Code
    //     ```

    // 13. Inline Code, enclose inline code within backticks 
    //     `code`

    // 14. Tables:
    //     | Header 1 | Header 2 |
    //     | -------- | -------- |
    //     | cell 1   | cell 2   |
    //     | cell 3   | cell 4   |

    response = response.replaceAll('\n', '<br>')
    let formatted_response = '';
    
    // separate the response into code blocks
    const code_blocks = response.split('```')
    
}

const format_response = (response, model = 0) => {
    switch(model) {
        case 0:
            return format_chatgpt_response(response)
        case 1:
            return format_gemini_response(response)
        default:
            return 'Invalid model'
    }
}

console.log(format_response(test_format_response, 0))