import './Variables.css';

function Variables({ editor }) {

    const variables = [
        "{{user_name}}",
        "{{email}}",
        "{{company}}",
        "{{event_name}}",
        "{{event_date}}",
        "{{cert_id}}",
        "{{reset_link}}",
        "{{invoice_id}}",
        "{{amount}}",
        "{{support_email}}",
    ];
    return (
        <div className='variables-container'>
            <p className='variables-para'>VARIABLES</p>
            {
                variables.map((variable) => (
                    <button
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .insertContent(variable)
                                .run()
                        }
                    >
                        {variable}
                    </button>
                ))   
            }
            <p>Click to insert at cursor</p>
        </div>
    )
}

export default Variables
