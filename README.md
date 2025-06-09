# Burmese Number Converter

A web application built with **Next.js** and **React** to convert numbers between standard Arabic numerals (e.g., 123,456) and Burmese number text (e.g., တစ်သိန်း နှစ်ထောင်). The application supports accurate Burmese number formatting, including for units like thousands (ထောင်), hundreds (ရာ), and tens (ဆယ်) when followed by lower units.

-----

## Website Link

Experience the Burmese Number Converter live: [Link](https://burmese-number-converter.vercel.app)

-----

## Screenshots

Here are some screenshots of the application in action:

**Light Mode:**
*A clean interface showcasing the converter in light mode.*

**Dark Mode:**
*The sleek dark theme of the converter.*

**Conversion Example:**
*Demonstration of a number conversion from standard to Burmese text.*

-----

## Features

  * **Bidirectional Conversion:** Convert standard numbers to Burmese text and vice versa.
  * **Accurate Burmese Formatting:** Handles Burmese number conventions, such as:
      * 100 → တစ်ရာ
      * 110 → တစ်ရာ့ တစ်ဆယ်
      * 1,110 → တစ်ထောင့် တစ်ရာ့ တစ်ဆယ်
      * 100,000 → တစ်သိန်း
  * **User-Friendly Interface:** Clean, responsive design with light/dark mode toggle.
  * **Input Validation:** Rejects invalid inputs and provides clear error messages.
  * **Animations:** Smooth GSAP animations for theme switching.
  * **Accessibility:** ARIA attributes for screen reader support.

---

## Tech Stack

* **Framework:** Next.js 15 (App Router)
* **Language:** JavaScript (React)
* **Styling:** Tailwind CSS (via inline styles and JSX)
* **Animations:** GSAP (GreenSock Animation Platform)
* **Deployment:** Vercel

---

## Installation

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/your-username/burmese-number-converter.git
    cd burmese-number-converter
    ```

2.  **Install Dependencies:**
    Ensure you have Node.js (v16 or higher) installed, then run:

    ```bash
    npm install
    ```

3.  **Run the Development Server:**

    ```bash
    npm run dev
    ```

    Open `http://localhost:3000` in your browser to see the application.

4.  **Build for Production:**

    ```bash
    npm run build
    npm start
    ```

---

## Usage

### Standard Number Input:

* Enter a number (e.g., "123,456") in the "Standard Number" field.
* The application converts it to Burmese text (e.g., တစ်သိန်း နှစ်ထောင်).
* Only positive integers are accepted (no negative numbers or decimals).

### Burmese Number Input:

* Enter Burmese number text (e.g., တစ်ရာ့ တစ်ဆယ်) in the "Burmese Number" field.
* The application converts it to a standard number (e.g., 110).
* Supports units from ones (ခု) to crores (ကုဋေ) and Burmese digits (၀-၉).

### Toggle Theme:

* Click the sun/moon icon in the top-left corner to switch between light and dark modes.

### Clear Inputs:

* Click the "Clear" button to reset both input fields.

---

## Example Conversions

| Standard Number | Burmese Number Text         |
| :-------------- | :-------------------------- |
| 100             | တစ်ရာ                     |
| 110             | တစ်ရာ့ တစ်ဆယ်             |
| 1,101           | တစ်ထောင့် တစ်ရာ့ တစ်ခု      |
| 100,000         | တစ်သိန်း                   |
| 123             | တစ်ရာ့ နှစ်ဆယ့် သုံးခု     |

---

## Contributing

Contributions are welcome! To contribute:

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/your-feature`).
3.  Commit your changes (`git commit -m "Add your feature"`).
4.  Push to the branch (`git push origin feature/your-feature`).
5.  Open a Pull Request.

Please ensure your code follows the existing style and includes tests for new features.

---

## Testing

To add unit tests, use a testing framework like Jest:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

Example test for conversion functions:

```javascript
describe('numberToBurmese', () => {
  test('converts 110 to တစ်ရာ့ တစ်ဆယ်', () => {
    expect(numberToBurmese(110)).toBe('တစ်ရာ့ တစ်ဆယ်');
  });
});
```

---

## Known Issues

* No support for decimal numbers or negative numbers (by design).

---

## Future Enhancements

* Add support for decimal numbers in Burmese format.
* Implement debouncing for input handling to improve performance.
* Add a conversion history feature.
* Support alternative Burmese number spellings or regional variations.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Acknowledgments

* Built with Next.js and React.
* Animations powered by GSAP.
* Inspired by senior developer from Facebook (Sorry for forget the exact insipiration)

For questions or feedback, please open an issue.
