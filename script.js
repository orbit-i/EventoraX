const faqs = document.querySelectorAll(".faq");

faqs.forEach(faq => {

    const btn = faq.querySelector(".faq-btn");

    btn.addEventListener("click", () => {

        faq.classList.toggle("active");

        const content = faq.querySelector(".faq-content");

        if (content.style.maxHeight) {

            content.style.maxHeight = null;

        } else {

            content.style.maxHeight = content.scrollHeight + "px";

        }

    });

});