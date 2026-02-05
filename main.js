// Cloudflare Pages Function 프록시 경로
const PROXY_URL = '/api/gemini';

// DOM 요소
const dreamInput = document.getElementById('dream-input');
const interpretBtn = document.getElementById('interpret-btn');
const resultSection = document.getElementById('result-section');
const easternResult = document.getElementById('eastern-result');
const westernResult = document.getElementById('western-result');
const lottoSection = document.getElementById('lotto-section');
const lottoResult = document.getElementById('lotto-result');
const lottoNumbers = document.getElementById('lotto-numbers');
const loading = document.getElementById('loading');

// 해몽하기 버튼 클릭
interpretBtn.addEventListener('click', async () => {
  const dreamText = dreamInput.value.trim();

  if (!dreamText) {
    alert('꿈 내용을 입력해주세요.');
    return;
  }

  if (dreamText.length < 10) {
    alert('꿈 내용을 좀 더 자세히 적어주세요. (최소 10자)');
    return;
  }

  // UI 상태 변경
  interpretBtn.disabled = true;
  loading.classList.remove('hidden');
  resultSection.classList.add('hidden');

  try {
    const result = await getDreamInterpretation(dreamText);

    // 결과 파싱 및 표시
    displayResults(result);

    resultSection.classList.remove('hidden');
    lottoSection.classList.remove('hidden');
    lottoResult.classList.remove('hidden');

  } catch (error) {
    console.error('해몽 오류:', error);
    alert('해몽 중 오류가 발생했습니다. 다시 시도해주세요.');
  } finally {
    interpretBtn.disabled = false;
    loading.classList.add('hidden');
  }
});

// Gemini API로 해몽 및 로또 번호 요청
async function getDreamInterpretation(dreamText) {
  const prompt = `너는 20년 경력의 전문 해몽가야. 사용자가 꿈 내용을 입력하면 **[동양적 관점]**과 **[서양적 관점]**으로 나누어 각각 300자 정도로 간략히 설명해 줘. 마지막에는 그 꿈의 기운과 어울리는 **로또 번호 5세트(각 6개 숫자, 1-45 범위)**를 생성해 줘.

꿈 내용: "${dreamText}"

다음 형식으로 정확히 응답해줘:

[동양적 관점]
(동양 해몽 내용)

[서양적 관점]
(서양 해몽 내용)

[로또 번호]
1세트: 1, 2, 3, 4, 5, 6
2세트: 7, 8, 9, 10, 11, 12
3세트: 13, 14, 15, 16, 17, 18
4세트: 19, 20, 21, 22, 23, 24
5세트: 25, 26, 27, 28, 29, 30`;

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  const data = await response.json();

  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error('응답 파싱 실패');
}

// 결과 파싱 및 표시
function displayResults(text) {
  // 동양적 관점 추출
  const easternMatch = text.match(/\[동양적 관점\]\s*([\s\S]*?)(?=\[서양적 관점\])/);
  const easternText = easternMatch ? easternMatch[1].trim() : '해석을 불러올 수 없습니다.';

  // 서양적 관점 추출
  const westernMatch = text.match(/\[서양적 관점\]\s*([\s\S]*?)(?=\[로또 번호\])/);
  const westernText = westernMatch ? westernMatch[1].trim() : '해석을 불러올 수 없습니다.';

  // 로또 번호 추출
  const lottoMatch = text.match(/\[로또 번호\]\s*([\s\S]*?)$/);
  const lottoText = lottoMatch ? lottoMatch[1].trim() : '';

  // 해몽 결과 표시
  easternResult.textContent = easternText;
  westernResult.textContent = westernText;

  // 로또 번호 파싱 및 표시
  displayLottoNumbers(lottoText);
}

// 번호에 따른 공 색상 결정
function getBallColor(num) {
  if (num <= 10) return 'ball-yellow';
  if (num <= 20) return 'ball-blue';
  if (num <= 30) return 'ball-red';
  if (num <= 40) return 'ball-gray';
  return 'ball-green';
}

// 로또 번호 표시 (5세트)
function displayLottoNumbers(lottoText) {
  lottoNumbers.innerHTML = '';

  // 각 세트별로 번호 추출
  const setMatches = lottoText.matchAll(/(\d)세트[:\s]*([\d,\s]+)/g);

  for (const match of setMatches) {
    const setNumber = match[1];
    const numbersStr = match[2];
    const numbers = numbersStr.match(/\d+/g)?.map(n => parseInt(n, 10)).slice(0, 6) || [];

    if (numbers.length === 6) {
      const setDiv = document.createElement('div');
      setDiv.className = 'lotto-set';

      const setLabel = document.createElement('span');
      setLabel.className = 'set-label';
      setLabel.textContent = `${setNumber}세트`;
      setDiv.appendChild(setLabel);

      const ballsDiv = document.createElement('div');
      ballsDiv.className = 'lotto-balls';

      numbers.sort((a, b) => a - b).forEach(num => {
        const ball = document.createElement('div');
        ball.className = `lotto-ball ${getBallColor(num)}`;
        ball.textContent = num;
        ballsDiv.appendChild(ball);
      });

      setDiv.appendChild(ballsDiv);
      lottoNumbers.appendChild(setDiv);
    }
  }
}
