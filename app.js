// ============================================================
// PAGE ELEMENTS
// ============================================================

const surfButton =
    document.getElementById("surfButton");

const submitSite =
    document.getElementById("submitSite");

const surfCountNumber =
    document.getElementById("surfCountNumber");


// ============================================================
// GLOBAL COUNTER CONFIGURATION
// ============================================================

const COUNTER_NAMESPACE =
    "surftheweb-online";

let currentCounterDate =
    getPacificDate();

let counterStream = null;

let fallbackPollingActive = false;

let dateCheckInterval = null;


// ============================================================
// GET TODAY'S PACIFIC DATE
// ============================================================

function getPacificDate() {

    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "America/Los_Angeles",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        );

    return formatter.format(
        new Date()
    );
}


// ============================================================
// UPDATE COUNTER DISPLAY
// ============================================================

function updateSurfCount(count) {

    const formattedCount =
        Number(count).toLocaleString("en-US");

    surfCountNumber.textContent =
        formattedCount;
}


// ============================================================
// GET TODAY'S COUNTER
// ============================================================

async function loadSurfCount() {

    const today =
        getPacificDate();

    const url =
        `https://abacus.jasoncameron.dev/get/` +
        `${encodeURIComponent(COUNTER_NAMESPACE)}/` +
        `${encodeURIComponent(today)}`;

    try {

        const response =
            await fetch(url);

        // No counter exists yet today.
        if (response.status === 404) {

            updateSurfCount(0);

            return;
        }

        if (!response.ok) {

            throw new Error(
                `Counter API returned ${response.status}`
            );
        }

        const data =
            await response.json();

        updateSurfCount(
            data.value ?? 0
        );

    } catch (error) {

        console.error(
            "Could not load surf count:",
            error
        );

        surfCountNumber.textContent =
            "—";
    }
}


// ============================================================
// INCREMENT TODAY'S COUNTER
// ============================================================

async function incrementSurfCount() {

    const today =
        getPacificDate();

    const url =
        `https://abacus.jasoncameron.dev/hit/` +
        `${encodeURIComponent(COUNTER_NAMESPACE)}/` +
        `${encodeURIComponent(today)}`;

    try {

        const response =
            await fetch(url, {
                method: "GET",
                keepalive: true
            });

        if (!response.ok) {

            throw new Error(
                `Counter API returned ${response.status}`
            );
        }

        const data =
            await response.json();

        updateSurfCount(
            data.value ?? 0
        );

    } catch (error) {

        console.error(
            "Could not increment surf count:",
            error
        );
    }
}


// ============================================================
// LIVE COUNTER STREAM
// ============================================================

function connectCounterStream() {

    const today =
        getPacificDate();

    currentCounterDate =
        today;

    // Close an old stream first.
    if (counterStream) {

        counterStream.close();

        counterStream =
            null;
    }

    const streamUrl =
        `https://abacus.jasoncameron.dev/stream/` +
        `${encodeURIComponent(COUNTER_NAMESPACE)}/` +
        `${encodeURIComponent(today)}`;

    try {

        counterStream =
            new EventSource(
                streamUrl
            );

        // ----------------------------------------------------
        // LIVE UPDATE
        // ----------------------------------------------------

        counterStream.onmessage =
            (event) => {

                try {

                    const data =
                        JSON.parse(
                            event.data
                        );

                    if (
                        data.value !== undefined
                    ) {

                        updateSurfCount(
                            data.value
                        );
                    }

                } catch (error) {

                    console.error(
                        "Could not parse live counter update:",
                        error
                    );
                }
            };


        // ----------------------------------------------------
        // STREAM ERROR
        // ----------------------------------------------------

        counterStream.onerror =
            () => {

                console.warn(
                    "Live counter stream temporarily unavailable."
                );

                // EventSource automatically attempts
                // to reconnect.

                startFallbackPolling();
            };

    } catch (error) {

        console.error(
            "Could not create counter stream:",
            error
        );

        startFallbackPolling();
    }
}


// ============================================================
// FALLBACK POLLING
// ============================================================
//
// If SSE temporarily fails, check the counter every 5 seconds.
// This keeps the counter functional even if the live stream
// becomes unavailable.
//

function startFallbackPolling() {

    if (fallbackPollingActive) {
        return;
    }

    fallbackPollingActive =
        true;

    setInterval(
        async () => {

            const today =
                getPacificDate();

            if (
                today !==
                currentCounterDate
            ) {

                fallbackPollingActive =
                    false;

                connectCounterStream();

                await loadSurfCount();

                return;
            }

            await loadSurfCount();

        },
        5000
    );
}


// ============================================================
// WATCH FOR MIDNIGHT PACIFIC TIME
// ============================================================
//
// This handles the situation where someone leaves the
// SurfTheWeb homepage open across midnight.
//

function startPacificDateWatcher() {

    dateCheckInterval =
        setInterval(
            () => {

                const today =
                    getPacificDate();

                if (
                    today !==
                    currentCounterDate
                ) {

                    currentCounterDate =
                        today;

                    // The old stream belongs to yesterday.
                    connectCounterStream();

                    // The new day's counter begins at 0
                    // until someone surfs.
                    loadSurfCount();
                }

            },
            1000
        );
}


// ============================================================
// RANDOM WEBSITE SELECTION
// ============================================================

function chooseRandomWebsite() {

    const randomIndex =
        Math.floor(
            Math.random() *
            websites.length
        );

    return websites[randomIndex];
}


// ============================================================
// SURF BUTTON
// ============================================================

function surf() {

    if (!websites.length) {

        alert(
            "There are currently no websites available."
        );

        return;
    }

    const selectedSite =
        chooseRandomWebsite();

    surfButton.disabled =
        true;

    surfButton.textContent =
        "SURFING...";

    // Increment today's global counter.
    incrementSurfCount();

    setTimeout(
        () => {

            window.location.href =
                selectedSite.url;

        },
        250
    );
}


// ============================================================
// RESET BUTTON WHEN RETURNING WITH BROWSER BACK BUTTON
// ============================================================

function resetSurfButton() {

    surfButton.disabled =
        false;

    surfButton.textContent =
        "SURF";
}

window.addEventListener(
    "pageshow",
    () => {
        resetSurfButton();
    }
);


// ============================================================
// WEBSITE SUGGESTION
// ============================================================

submitSite.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        const subject =
            encodeURIComponent(
                "SurfTheWeb Website Suggestion"
            );

        const body =
            encodeURIComponent(
                "Hi SurfTheWeb,\n\n" +
                "I'd like to suggest this website " +
                "for the SurfTheWeb database:\n\n" +
                "Website URL: \n\n" +
                "Why I think it belongs on SurfTheWeb:\n\n"
            );

        const gmailUrl =
            "https://mail.google.com/mail/?" +
            "view=cm" +
            "&fs=1" +
            "&to=kitodigitalbusiness@gmail.com" +
            `&su=${subject}` +
            `&body=${body}`;

        window.location.href =
            gmailUrl;
    }
);


// ============================================================
// INITIAL PAGE SETUP
// ============================================================

resetSurfButton();

surfCountNumber.textContent =
    "—";

surfButton.addEventListener(
    "click",
    surf
);


// ============================================================
// START COUNTER
// ============================================================

loadSurfCount();

connectCounterStream();

startPacificDateWatcher();